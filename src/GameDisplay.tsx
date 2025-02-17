import { useEffect, useRef, useState } from "react";
import _ from "lodash";
import { clear, draw } from "./process_draws";
import { animation, update_and_draw } from "./animations";
import { toggleMute, getMuted, changeSound, getCurrentTrack, playSound} from "./Sound"; 

import React from "react";
import { display_type, events_type, gamedata, props_to_run } from "./interfaces";
import { set_events } from "./EventManager";
import { combine_obj } from "./lines";



//let globalStore : globalStore_type = {};

let interval : number = -1; 
let last_tick : number = Date.now(); 

const FPS = 60; 

//does NOT clone any functions
export function clone_gamedata(x : gamedata) : gamedata{
    let y : gamedata =  {...x};
    y.display = JSON.parse(JSON.stringify(y.display));
    return y; 
}



function GameDisplay( props : {data  : gamedata, globalStore : globalStore_type}){
    let {g ,draw_fn , anim_fn , sound_fn , init , button_click , prop_commands , display , reset_fn  , prop_fns}  = props.data;
    let globalStore = props.globalStore;
    const [display_data, change_display] = useState<display_type>(display);
    console.log("rendering");
//    const globalStore = useState<globalStore_type>(props.store)[0];
    
    if(g == undefined){
        throw "no game found"; 
    }
    async function reset(){

        last_tick = Date.now();
        clearInterval(interval);
        interval = -1; 
        reset_fn(); 
        console.log("g cleared");
    }
    console.log("refreshed");
    const [r, refresh] = useState<boolean>(false);
    let refs : Record<string, React.RefObject<HTMLCanvasElement> > = {}; 
    for(var item of display_data.canvas){
        refs[item[0]] =  useRef<HTMLCanvasElement>(null);
    }

    let anim_lst : animation<typeof g>[] = []; 
    function handle_prop(s : string, t : any){
        if(s == "rerender"){
            refresh(!r);
        }            
        if(s == "reset"){
            anim_lst = [];
            reset();
            refresh(!r);
        }
        if(s == "change display" && t != undefined){
            change_display(t);
        }
        if(prop_fns[s] != undefined){
            prop_fns[s](g,globalStore, t)
        }
    }

    useEffect(function(){
        // componentDidMount;
        init(g, globalStore);
        set_events(g, globalStore);

        // clear sound
        if(getCurrentTrack() != undefined){
            changeSound(undefined);
        }
        
        // game loop
        if(interval == -1) {  
            last_tick = Date.now() //
            interval = window.setInterval(function(){
                //console.log(g);
                if(g == undefined){
                    return;
                }
                let new_tick = Date.now(); 
                //tick the game once 
                let evtlst : events_type[] = [];
                while(last_tick < new_tick){
                    let new_events = g.tick();
                    evtlst = evtlst.concat(new_events);
                    last_tick += 1000/FPS 
                } 

                for(let [s,t] of prop_commands(g, globalStore, evtlst)){
                    handle_prop(s, t); 
                }

                // handle sound
                let [newsound, playsounds] =  sound_fn(g, globalStore, evtlst)
                if(getCurrentTrack() != newsound){
                    changeSound(newsound);
                }
                for(let item of playsounds){
                    playSound(item);
                }
                // drawings and animations 
                for(let [item, unused] of display_data.canvas){
                    let [cmds, should_clear] = draw_fn(g, globalStore, evtlst, item);
                    let canvas = refs[item];
                    if(should_clear){
                        clear(canvas)
                    }
                    draw(cmds, canvas);
                }
                // animations 
                anim_lst = anim_lst.concat(anim_fn(g, globalStore, evtlst));
                update_and_draw(anim_lst, g,globalStore,refs)

            }, 1000/FPS) 


        }
        return function(){
            //componentWillUnmount
            console.log("unmounting");
            clearInterval(interval); 
            interval = -1;
            changeSound(undefined);
        }
    },[g,r,props])

    const button_click_disp = function(s : string){
        let lst  = button_click(g, globalStore, s);
        for(let [s,t] of lst){
            handle_prop(s,t);
        }
    }

    var return_lst : any[] = []
    let z_counter = 0
    for(let item of display_data.canvas){
        let name = item[0]; 
        let [x,y,w,h] = item[1]; 
        return_lst.push(<canvas style={{position:"absolute", top : y + "px", left : x + "px", zIndex : z_counter + (name.indexOf("background") == -1 ? 0 : -1000)}} width={w} height={h} ref={refs[name]} key={name + " canvas"} data-key={name}></canvas>)
        z_counter++; 
    }
    for(let item of display_data.button){
        let name = item[0]; 
        let [x,y,w,h] = item[1]; 
        let text = item[2];
        let image = item[3]
        if(image !== undefined){
            //@ts-ignore
            return_lst.push(<img src={image} style={{position:"absolute", top : y + "px", left : x + "px", width:w + "px", height : h + "px"}} onClick={() =>button_click_disp(name) }  ref={refs[name]} key = {image + " image btn" + `${x} ${y} ${w} ${h} ${text}`}/>)
        } else { 
            return_lst.push(<button key = {image + " btn "+ `${x} ${y} ${w} ${h} ${text}`} style={{position:"absolute", top : y + "px", left : x + "px", width:w + "px", height : h + "px" }} onClick={() => button_click_disp(name)} >{text}</button>)
        }
    }
    for(let item of display_data.image){
        let [name,img_el, x,y,w,h] = item;
        console.log(name)
        if(img_el){
            return_lst.push(<div style={{backgroundImage:`url(${name})`, position:"absolute", top : y + "px", left : x + "px", "zIndex" : -1,"width":w,"height":h}} key={name + " image" + x + " " + y} tabIndex={1}></div>)
        } else {
            return_lst.push(<img src={name} style={{ position:"absolute", top : y + "px", left : x + "px", "zIndex" : -1,"width":w,"height":h, userSelect : "none"}}  key={name + " div image"  + x + " " + y} tabIndex={1} />)
        }

    }
    for(let item of display_data.text){
        let [name,x,y,extra_style] = item;
        let style : Record<string, any>= { position:"absolute", top : y + "px", left : x + "px"};
        if(extra_style){
            combine_obj(style, extra_style);
        }
        return_lst.push(<div style={style} tabIndex={1} key = {name  + ` ${x} ${y} ${JSON.stringify(extra_style)} `}>{name}</div>)
    }
    return return_lst
}

export default GameDisplay
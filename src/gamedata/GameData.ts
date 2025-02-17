/*
game, draw_fn, anim_fn, sound_fn, add_event_listeners, button_click, prop_commands, prop_fns, display, reset_fn

*/

import _ from "lodash";
import { animation } from "../animations";
import { d_image } from "../canvasDrawing";
import GameDisplay from "../GameDisplay";
import { anim_fn_type, button_click_type, display_type, draw_fn_type, gamedata, init_type, point, prop_commands_type, props_to_run, reset_fn_type, sound_fn_type } from "../interfaces";
import {explode_anim, coin_anim} from "./animations";
import game from "./game";

export let display : display_type = {
    "button" : [["change_disp", [0, 600, 100, 100], "Change Display"]],
    "canvas" : [["main",[0,0,600,600]], ["anim_frame",[0,0,600,600]], ["collect", [600, 0, 100, 100]]],
    "image" : [["images/sahher.jpg",false, 0,0]],
    "text":[] 
}


export let draw_fn : draw_fn_type = function(g : game,globalStore : globalStore_type , events : any[] , canvas : string){
    let output : draw_command[] = []; 
    if(canvas === "main"){
        output.push({type:"drawImage", "x" : g.player[0]-5, "y":g.player[1]-5, "img":'images/player.png'})
        if(_.every(g.collected)){
            let [x,y] = g.exit
            output.push(d_image("images/door.png", x-10, y-10))
        }
    }
    return [output,true];
}

export let anim_fn : anim_fn_type = function(g: game, globalStore: globalStore_type, events: any[]) {
    let output : animation<game>[] = []; 
    if(globalStore.first_frame == false){
        globalStore.first_frame = true; 
        for(let i=0; i<g.points.length; i++){
            let [x,y] = g.points[i];
            output.push(new coin_anim(x,y,i,i));
            
            console.log("got here");
        }
    }

    for(let index of events){
        for(let i=0; i<20; i++){
            let item = g.points[index]; 
            output.push(new explode_anim(item[0], item[1]))
        }
    }
    return output;
}

export let sound_fn : sound_fn_type = function(g : game, globalStore : globalStore_type ,events : any[]){
    let sound = _.every(g.collected) ? "song.mp3" : "Frost-Waltz.mp3";
    if(events.length > 0){
        return [sound, ["tick.wav"]];
    } else {
        return [sound, []];
    }
}

export let prop_commands : prop_commands_type = function(g : game,globalStore : globalStore_type, events : any[]){
    let output : props_to_run = []; 
    if(_.every(g.collected) && globalStore.all_collected == false){
        globalStore.all_collected = true;
        // add the extra image 
        let data = JSON.parse(JSON.stringify(display)) as display_type;
        data.text.push(["End the game now!", 100, 100, {}]);
        output.push(["change display", data]);

    }
    if(g.completed){
        output.push(["new_game", null]);
    }
    return output; 
}

export let button_click : button_click_type = function(g : game,globalStore : globalStore_type, name : string){
    if(name == "change_disp"){
        let img = globalStore.current_image;
        if(img.indexOf("sahher") != -1){
            globalStore.current_image= "images/katy.webp";
        } else {
            globalStore.current_image= "images/sahher.jpg";
        }

        let data = JSON.parse(JSON.stringify(display)) as display_type;
        data.image[0][0] = globalStore.current_image;
        return [["change display", data]]; 
    } else {
        return [];
    }
}

export let reset_fn : reset_fn_type = function() {
    return ; 
}
export let init : init_type = function(g : game, globalStore : globalStore_type){
    return ;
}


export let data_obj : gamedata =  {
    draw_fn: draw_fn,
    anim_fn: anim_fn,
    sound_fn: sound_fn,
    init: init,
    button_click: button_click,
    prop_commands: prop_commands,
    display: display,
    reset_fn: reset_fn,
    prop_fns: {}
}
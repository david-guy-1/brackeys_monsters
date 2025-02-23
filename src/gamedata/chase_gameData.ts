/*
game, draw_fn, anim_fn, sound_fn, add_event_listeners, button_click, prop_commands, prop_fns, display, reset_fn

*/

import _ from "lodash";
import { animation } from "../animations";
import { d_image, d_text } from "../canvasDrawing";
import GameDisplay from "../GameDisplay";
import { anim_fn_type, button_click_type, display_type, draw_fn_type, gamedata, init_type, point, prop_commands_type, props_to_run, reset_fn_type, sound_fn_type } from "../interfaces";
import {explode_anim, coin_anim} from "./animations";
import game from "./game";
import { dist, lincomb, move_lst, moveTo } from "../lines";
import { canvas_size, player_max_hp, player_speed } from "./constants";
import { displace_command } from "../rotation";
import { draw_all, draw_arrow, draw_monsters, draw_repel_spells, draw_trees, move_player_to_point } from "./utilities";

export let display : display_type = {
    "button" : [],
    "canvas" : [["main_canvas main",[0,0,canvas_size[0],canvas_size[1]]]],
    "image" : [["images/background.png",false, 0,0]],
    "text":[] 
}

function assert_mode(g : game){
    if(g.mode != "chase"){
        throw "mode is not chase"; 
    }
}

export let draw_fn : draw_fn_type = function(g : game,globalStore : globalStore_type , events : any[] , canvas : string){
    assert_mode(g);
    let output : draw_command[] = []; 
    let scroll = lincomb(1, g.player, -1 ,globalStore.player_pos) as point; 
    // x -> x - scroll  
    if(canvas === "main_canvas main"){
        // draw player
        let d = lincomb(1, globalStore.mouse_pos, -1, globalStore.player_pos); 
        // d[0] < 0 -> left, >= 0 -> right
        output.push(d_image(`player/person${d[0] < 0 ? "" : "2"}.png`, lincomb(1, g.player, -1, [50, 50])))
        if(g.swing == undefined){
            output.push(d_image(`player/arm down${d[0] < 0 ? "" : "2"}.png`, lincomb(1, g.player, -1, [50, 50]))) 
        } else {
            output.push(d_image(`player/arm up${d[0] < 0 ? "" : "2"}.png`, lincomb(1, g.player, -1, [50, 50]))) 
        }
        output = output.concat(draw_all(g,globalStore));
    }
    output = output.map(x => displace_command(x, lincomb(1, [0,0], -1, scroll) as point));
    //arrow
    let cmd = draw_arrow(g)
    if(cmd){
        output.push(cmd);
    }
    //messages
    if(globalStore.flag_msg != undefined){
        output.push(d_text(globalStore.flag_msg, 20, 20));
    }
    // obj messages
    if(g.kill_target != undefined){
        output.push(d_text(`${g.monsters_killed} / ${g.kill_target}`, 20, 45));
    }
    if(g.time_target != undefined){
        output.push(d_text(`${g.time} / ${g.time_target}`, 20, 45));
    }
    output.push(d_text(`${player_max_hp- g.player_hits} / ${player_max_hp}`, 20, 70));
    
    let position = 100
    for(let [string, time] of globalStore.display_contents){
        if(g.time < time){
            output.push(d_text(string, 20, position));
            position + 30
        }
    }
    return [output,true];
}

export let anim_fn : anim_fn_type = function(g: game, globalStore: globalStore_type, events: any[]) {
    assert_mode(g);
    // clear display
    globalStore.display_contents = globalStore.display_contents.filter(([x,y]) =>y > g.time );
    let output : animation<game>[] = []; 
    return output;
}

export let sound_fn : sound_fn_type = function(g : game, globalStore : globalStore_type ,events : any[]){
    assert_mode(g);
    console.log(events)
    let lst = [];
    for(let item of events){
        if(item == "collected"){
            lst.push("alphabet/A.wav");
        }
        if(item == "seen"){
            if(globalStore.last_touch < g.time-10){
                lst.push("alphabet/B.wav");
            }
            globalStore.last_touch = g.time;
        }
        if(item == "monster"){
            if(globalStore.last_touch < g.time-10){
                lst.push("alphabet/C.wav");
            }
            globalStore.last_touch = g.time;
        }
        if(item == "kill"){
            lst.push("alphabet/D.wav");
        }    
        if(item == "fairy"){
            lst.push("alphabet/I.wav");
        }            
    }
    if(globalStore.repel_cast){
        globalStore.repel_cast = false;
        console.log("got here");
        lst.push("alphabet/E.wav");
    }
    if(globalStore.fireball_cast){
        globalStore.fireball_cast = false;
        lst.push("alphabet/F.wav");
    }
    if(globalStore.swing_cast){
        globalStore.swing_cast = false;
        lst.push("alphabet/G.wav");
    }
    if(g.tick_fn?.(g) != undefined && !globalStore.end_sound_playing){
        globalStore.end_sound_playing = true;
        lst.push("alphabet/H.wav");
    }

    return [undefined, lst];
}

export let prop_commands : prop_commands_type = function(g : game,globalStore : globalStore_type, events : any[]){
    assert_mode(g);
    // move player towards target
    move_player_to_point(g, globalStore);
    // if all monsters are dead
    if(g.tick_fn == undefined){
        throw "chase without a victory or defeat condition"
    }
    let result = g.tick_fn(g);
    if(result == "victory"){
        return [["victory", g]];
    } else if (result == "defeat"){
        return [["defeat", g]];
    }

    let output : props_to_run = []; 
    return output; 
}

export let button_click : button_click_type = function(g : game,globalStore : globalStore_type, name : string){
    assert_mode(g);
    return [];
}

export let reset_fn : reset_fn_type = function() {
    return ; 
}
export let init : init_type = function(g : game, globalStore : globalStore_type){
    assert_mode(g);
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
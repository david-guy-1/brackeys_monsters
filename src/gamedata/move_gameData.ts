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
import { lincomb, moveTo } from "../lines";
import { player_speed } from "./constants";

export let display : display_type = {
    "button" : [["up", [50,50,50,50], "up"], ["left", [0,100,50,50], "left"],
    ["down", [50,100,50,50], "down"], ["right", [100,100,50,50], "right"]],
    "canvas" : [["main_canvas a main",[200,0,600,600]]],
    "image" : [["images/bg2.png",false, 0,0]],
    "text":[] 
}

function assert_mode(g : game){
    if(g.mode != "move"){
        throw "mode is not move"; 
    }
}

export let draw_fn : draw_fn_type = function(g : game,globalStore : globalStore_type , events : any[] , canvas : string){
    assert_mode(g);
    let output : draw_command[] = []; 
    
    for(let x=0; x<g.dims[0]; x++){
        for(let y=0; y<g.dims[1]; y++){
            let point = [30*x+100, 30*y+100];
            output.push(d_image("images/thingy.png", point)); 
            if(x == g.player[0] && y == g.player[1]){
                //draw the player there 
                output.push(d_image("images/player.png", point)); 
            }        
        }
    }
    
    return [output,true];
}

export let anim_fn : anim_fn_type = function(g: game, globalStore: globalStore_type, events: any[]) {
    assert_mode(g);
    let output : animation<game>[] = []; 
    return output;
}

export let sound_fn : sound_fn_type = function(g : game, globalStore : globalStore_type ,events : any[]){
    assert_mode(g);
    return [undefined, []];
}

export let prop_commands : prop_commands_type = function(g : game,globalStore : globalStore_type, events : any[]){
    assert_mode(g);
    if(g.player[0] >= 9 && g.player[1] >= 9){
        return [["new_game", null]];
    }
    let output : props_to_run = []; 
    return output; 
}

export let button_click : button_click_type = function(g : game,globalStore : globalStore_type, name : string){
    assert_mode(g);
    switch(name){
        case "up":
            g.move_player_disc([0, -1]);
            break;
        case "down":
            g.move_player_disc([0, 1]);
            break;
        case "left":
            g.move_player_disc([-1,0]);
            break;
        case "right":
            g.move_player_disc([1,0]);
            break;
        
    }
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
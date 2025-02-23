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
import { lincomb, moveTo, pointInsideRectangleWH } from "../lines";
import { canvas_size, player_speed } from "./constants";

export let display : display_type = {
    "button" : [["up", [50,50,50,50], "up"], ["left", [0,100,50,50], "left"],
    ["down", [50,100,50,50], "down"], ["right", [100,100,50,50], "right"], ["restart", [0,160,150,50], "restart"]],
    "canvas" : [["main_canvas a main",[200,0,600,600]]],
    "image" : [["images/bg3.png",false, 0,0]],
    "text":[["WASD to move", 10, 300, {}], ["Get to bottom right", 10, 340, {}]] 
}

function assert_mode(g : game){
    if(g.mode != "maze"){
        throw "mode is not maze"; 
    }
}

export let draw_fn : draw_fn_type = function(g : game,globalStore : globalStore_type , events : any[] , canvas : string){
    assert_mode(g);
    let output : draw_command[] = []; 
    
    for(let x=0; x<g.dims[0]; x++){
        for(let y=0; y<g.dims[1]; y++){
            let tree = g.is_tree(x,y)

            let point = [30*x+10, 30*y+10];
            if(tree){
                output.push(d_image("images/tree_maze.png", point));
            } 
            if(x == g.player[0] && y == g.player[1]){
                //draw the player there 
                output.push(d_image("images/player_maze.png", point)); 
            }        
        }
    }
    output.push(d_text(`${g.maze_chops} chops remaining`, 50,canvas_size[1]-10))
    if(globalStore.maze_msg != "good"){
        if(globalStore.maze_msg == "chops"){
            output.push(d_text(`Can't move there - no more chops`, 50,canvas_size[1]-35))
        }
        if(globalStore.maze_msg == "bounds"){
            output.push(d_text(`Can't move there - out of bounds`, 50,canvas_size[1]-35))
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
    if(globalStore.maze_chopped == true){
        globalStore.maze_chopped = false;
        return [undefined, ["sounds/kill.wav"]];
        
    }
    return [undefined, []];
}

export let prop_commands : prop_commands_type = function(g : game,globalStore : globalStore_type, events : any[]){
    if(g.tick_fn == undefined){
        throw "maze without a victory or defeat condition"
    }
    let result = g.tick_fn(g);
    if(result == "victory"){
        return [["victory", g]];
    } else if (result == "defeat"){
        return [["defeat", g]];
    }
    return []; 
}
export let chop_tree = function(g : game, direction : point, globalStore : globalStore_type){
    globalStore.maze_msg = g.move_maze(direction);
    if(globalStore.maze_msg == "chopped"){
        globalStore.maze_chopped = true;
    }
}
export let button_click : button_click_type = function(g : game,globalStore : globalStore_type, name : string){
    assert_mode(g);
    
    let next_v : point= [0,0]
    switch(name){
        case "up":
            next_v = [0, -1];
            break;
        case "down":
            next_v = [0, 1];
            break;
        case "left":
            next_v = [-1,0];
            break;
        case "right":
            next_v = [1,0];
            break;
        case "restart":
            g.restart_maze();
            break;
    }
    if("up down left right".split(" ").indexOf(name) != -1){
        chop_tree(g, next_v, globalStore);
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
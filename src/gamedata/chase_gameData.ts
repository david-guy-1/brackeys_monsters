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
import { dist, lincomb } from "../lines";

export let display : display_type = {
    "button" : [],
    "canvas" : [["main_canvas main",[0,0,600,600]]],
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
    let scroll = lincomb(1, g.player, -1 ,[300,300]) as point; 
    // x -> x - scroll  
    if(canvas === "main_canvas main"){
        output.push({type:"drawImage", "x" :300, y : 300, "img":'images/person.png'})
        for(let monster of g.monsters) {
            output.push(d_image("images/monster.png", lincomb(1, monster, -1, scroll)));
        }
        for(let tree of g.trees) {
            output.push(d_image("images/tree.png", lincomb(1, tree, -1, scroll)));
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
    // if at least 5 monsters are touching the player :
    let x = _.countBy(g.monsters.map(x => dist(x, g.player) < 10 ? "a" : "b") )["a"];
    if(x >= 5){
        return [["new_game", null]];
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
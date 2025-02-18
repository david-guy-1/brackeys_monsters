/*
game, draw_fn, anim_fn, sound_fn, add_event_listeners, button_click, prop_commands, prop_fns, display, reset_fn

*/

import _ from "lodash";
import { animation } from "../animations";
import { add_com, d_image, d_line } from "../canvasDrawing";
import GameDisplay from "../GameDisplay";
import { anim_fn_type, button_click_type, display_type, draw_fn_type, gamedata, init_type, point, prop_commands_type, props_to_run, reset_fn_type, sound_fn_type } from "../interfaces";
import {explode_anim, coin_anim} from "./animations";
import game from "./game";
import { dist, lincomb, moveTo, rescale } from "../lines";
import { displace_command } from "../rotation";
import { canvas_size, player_speed } from "./constants";
import { draw_monsters, draw_repel_spells, draw_trees, move_player_to_point } from "./utilities";

export let display : display_type = {
    "button" : [],
    "canvas" : [["main_canvas main",[0,0,canvas_size[0],canvas_size[1]]]],
    "image" : [["images/background.png",false, 0,0]],
    "text":[] 
}

function assert_mode(g : game){
    if(g.mode != "escort"){
        throw "mode is not escort"; 
    }
}

export let draw_fn : draw_fn_type = function(g : game,globalStore : globalStore_type , events : any[] , canvas : string){
    assert_mode(g);
    let output : draw_command[] = []; 
    let scroll = lincomb(1, g.player, -1 ,globalStore.player_pos) as point; 
    // x -> x - scroll  
    if(canvas === "main_canvas main"){
        output.push(d_image('images/person.png', g.player))
        output = output.concat(draw_trees(g)).concat(draw_monsters(g)).concat(draw_repel_spells(g));
        output.push(d_image("images/escorted.png", g.escort_pos));
        for(let i=0; i < g.escort_points.length-1; i++){
            output.push(add_com(d_line(g.escort_points[i], g.escort_points[i+1]), {"width":4, "color":"red"}));
        }
        output = output.map(x => displace_command(x, lincomb(1, [0,0], -1, scroll) as point));
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
    // move player
    move_player_to_point(globalStore);


    let output : props_to_run = []; 

    // if at least 5 monsters are touching the player :
    if(dist(g.escort_pos, g.escort_points[g.escort_points.length-1] ) < 10) { 
        return [["new_game", null]];
    }
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
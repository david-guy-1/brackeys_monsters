/*
game, draw_fn, anim_fn, sound_fn, add_event_listeners, button_click, prop_commands, prop_fns, display, reset_fn

*/

import _ from "lodash";
import { animation } from "../animations";
import { add_com, d_circle, d_image, d_text } from "../canvasDrawing";
import GameDisplay from "../GameDisplay";
import { anim_fn_type, button_click_type, display_type, draw_fn_type, gamedata, init_type, point, prop_commands_type, props_to_run, reset_fn_type, sound_fn_type } from "../interfaces";
import {explode_anim, coin_anim, potion_anim} from "./animations";
import game from "./game";
import { lincomb, moveTo } from "../lines";
import { cauldron_pos, player_speed, potion_size, potion_start, potions_per_row } from "./constants";

export let display : display_type = {
    "button" : [["undo", [50,50,50,50], "undo"],["reset", [50,100,50,50], "reset"]],
    "canvas" : [["anims",[200,0,600,600]],["main_canvas a main",[200,0,600,600]]],
    "image" : [["images/bg4.png",false, 0,0]],
    "text":[] 
}

function assert_mode(g : game){
    if(g.mode != "potions"){
        throw "mode is not potions"; 
    }
}

export let draw_fn : draw_fn_type = function(g : game,globalStore : globalStore_type , events : any[] , canvas : string){
    assert_mode(g);
    let output : draw_command[] = []; 
    // draw potions on table
    for(let i = 0 ; i < g.potions.length; i++){
        let [x,y] = lincomb(1, potion_start, potion_size, [i%potions_per_row , Math.floor(i/potions_per_row)]);
        if(g.already_put.indexOf(g.potions[i]) == -1 && globalStore.selected_potion != i){ 
            output.push(add_com(d_circle(x,y,potion_size/2 - 4), {"color":g.potions[i], fill:true}));
            // number
            output.push(add_com(d_text((i+1).toString(), x-potion_size*0.25, y + potion_size*0.25), {color:"black"}));
        }

    }
    // draw selected potion
    if(globalStore.selected_potion != undefined){
        let [x,y] = globalStore.mouse_pos;
        output.push(add_com(d_circle(x,y,potion_size/2 - 4), {"color":g.potions[globalStore.selected_potion], fill:true}));
    }
    //draw cauldron
    output.push(d_image("images/cauldron.png", cauldron_pos));
    // draw rules
    let matches = g.check_potions(); 
    for(let [i, rule] of g.rules.entries()){
        let constrained_potion = g.potions.indexOf(rule.x);
        let rule_str = "";
        if(rule.type == "first"){
            rule_str = `Potion ${constrained_potion + 1} must be among the first ${rule.y} potions`; 
        }     
        else if(rule.type == "last"){
            rule_str = `Potion ${constrained_potion + 1} cannot be among the first ${rule.y} potions`; 
        } else if(rule.type == "before" && typeof rule.y == "string"){
            rule_str = `Potion ${constrained_potion + 1} must be before potion  ${g.potions.indexOf(rule.y)+1}`; 
        }
        output.push(add_com(d_text(rule_str, 10, 23 * i+30), {size:15, color : matches[i] ? "white" : "red"}));
    }
    // already added:
    output.push(add_com(d_text(g.already_put.map(x => g.potions.indexOf(x) + 1).join(","), cauldron_pos[0] + 250, 400), {size:20, color : "black"}));
    return [output,true];
    
}

export let anim_fn : anim_fn_type = function(g: game, globalStore: globalStore_type, events: any[]) {
    assert_mode(g);
    let output : animation<game>[] = []; 
    if(globalStore.potion_anim_state != undefined){
        g.add_potion(globalStore.potion_anim_state?.color);
        output = [new potion_anim(globalStore.potion_anim_state.place, globalStore.potion_anim_state.color)];
        globalStore.potion_anim_state = undefined;
        console.log("got here");
    }
    return output;
}

export let sound_fn : sound_fn_type = function(g : game, globalStore : globalStore_type ,events : any[]){
    assert_mode(g);
    return [undefined, []];
}

export let prop_commands : prop_commands_type = function(g : game,globalStore : globalStore_type, events : any[]){
    assert_mode(g);
    if(g.tick_fn == undefined){
        throw "potions without a victory or defeat condition"
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
    switch(name){
        case "undo":
            g.remove_last_potion();
        break;
        case "reset":
            g.already_put = [];
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
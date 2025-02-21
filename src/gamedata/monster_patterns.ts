// all these functions add a monster;

import { lincomb } from "../lines";
import game, { monster, repel_spell } from "./game";

// default functions :
/*
see_player : (g : game) => void;
should_check : (g : game, type : attack_type ) => boolean; // hit by player attack
hit : (g : game, type : attack_type) => void; // hit by player attack
touch_player : (g : game, laser : boolean) => void; // monster touched player
tick_fn : (g : game) => void
*/

function repel_monster(x : point, y : repel_spell) {
    // move monster in direction of repel spell
    let position = lincomb(1, x, 0.9, y.velocity) as point;
    return position; 
}

// FOR MONSTER

//see_player
function a(this : monster ,g : game){}; 
// should_check
function b(this : monster ,g : game, type : attack_type){return true}; 
//hit
function c(this : monster ,g : game, type : attack_type){
    if(type instanceof repel_spell){
        g.move_wall(this.position, repel_monster(this.position, type));
        if(this.vision != undefined){
            this.vision.direction = Math.atan2(type.velocity[1], type.velocity[0]);
        }
    } else {
        this.active = false;
    }
}
// touch_player
function d(this : monster, g : game, laser : boolean){}
// tick
function e(this : monster, g : game){};


export function wanderer(g : game, x : number, y : number, speed : number){
    let m = new monster([x,y], "wanderer",a,b,c,d,e); 
    m.attrib["angle"] = Math.random() * 360; 
    m.attrib["speed"] = speed;
    m.attrib["angle_vel"] = 0;
    m.tick = function(this : monster , g:game){
        m.attrib["angle_vel"] += (Math.random()-0.5)*0.01;
        if(Math.abs(m.attrib["angle_vel"]) > 1){
            m.attrib["angle_vel"] = 0; 
        }
        m.attrib["angle"] += m.attrib["angle_vel"];
        g.move_wall(m.position, lincomb(1,m.position, m.attrib["speed"], [Math.cos(m.attrib["angle"]),Math.sin(m.attrib["angle"])]) as point)
    }
    g.monsters.push(m);
}


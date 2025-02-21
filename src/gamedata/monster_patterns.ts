// all these functions add a monster;

import { cross, dist, lincomb } from "../lines";
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
        let angle = Math.atan2(type.velocity[1], type.velocity[0]);
        g.move_wall(this.position, repel_monster(this.position, type));
        if(this.vision != undefined){
            this.vision.direction = angle
        }
        if(this.attrib["angle"] != undefined){
            this.attrib["angle"]  = angle;
        }
    } else {
        this.active = false;
    }
}
// touch_player
function d(this : monster, g : game, laser : boolean){}
// tick
function e(this : monster, g : game){for(let item of this.attrib["tick"]) { item(this, g)}};

/*
functions come in 3 kinds : 
the tick function itself, a function to make an arbitrary monster use that tick function, and a function that creates a new monster;
*/

// tick attrib is an array of functions - args are (monster , game), that are called every single time

// make the monster wander 
// attrib: uses angle and angel_vel, must have speed
function wander_tick(m : monster , g:game){
    m.attrib["angle_vel"] += (Math.random()-0.5)*0.01;
    if(Math.abs(m.attrib["angle_vel"]) > 0.1){
        m.attrib["angle_vel"] = 0; 
    }
    m.attrib["angle"] += m.attrib["angle_vel"];
    g.move_wall(m.position, lincomb(1,m.position, m.attrib["speed"], [Math.cos(m.attrib["angle"]),Math.sin(m.attrib["angle"])]) as point)
    if(m.vision){
        m.vision.direction = m.attrib["angle"];
    }
}

function wander_monster(m : monster){
    m.attrib["angle"] = Math.random() * 360; 
    m.attrib["angle_vel"] = 0;
    m.attrib["tick"].push(wander_tick);
}

export function wanderer(g : game, x : number, y : number, speed : number){
    let m = new monster([x,y], "wanderer",a,b,c,d,e); 
    m.attrib["tick"] = [];
    m.attrib["speed"] = speed;
    wander_monster(m);
    g.monsters.push(m);
}

// make the monster pursue the player (possibly with an offset) 
// attrib: uses angle and offset, must have speed
function pursue_tick(m : monster , g:game){
    let target = lincomb(1, lincomb(1,g.player ,1 ,m.attrib["offset"]) , -1, m.position) as point; 
    let angle = m.attrib["angle"]
    let cross_prod  = cross([Math.cos(angle), Math.sin(angle), 0], [target[0], target[1], 0])[2]
    if(cross_prod > 0){
        angle += 0.01
    } else {
        angle -= 0.01
    }
    m.attrib["angle"] = angle
    g.move_wall(m.position, lincomb(1,m.position, m.attrib["speed"], [Math.cos(m.attrib["angle"]),Math.sin(m.attrib["angle"])]) as point)
    if(m.vision){
        m.vision.direction = m.attrib["angle"];
    }
}

function pursue_monster(m : monster){
    m.attrib["angle"] = Math.random() * 360; 
    m.attrib["offset"] = [0,0];
    m.attrib["tick"].push(pursue_tick);
}


export function pursue(g : game, x : number, y : number, speed : number){
    let m = new monster([x,y], "wanderer",a,b,c,d,e); 
    m.attrib["tick"] = [];
    m.attrib["speed"] = speed;
    pursue_monster(m);
    g.monsters.push(m);
}

export function lunge_tick(m : monster, g : game){
    let a = m.attrib; 
    let distance = dist(m.position, g.player);

    let can_lunge = g.time >= a["lunge duration"] + a["lunge cooldown"] + a["lunge start time"]  || g.time <= a["lunge start time"] + a["lunge duration"]
    if(!can_lunge || distance > m.attrib["lunge radius"] ){
        wander_tick(m, g);
    } else { 
        if(g.time >= a["lunge duration"] + a["lunge cooldown"] + a["lunge start time"]){
            a["lunge start time"] = g.time;
        }
        let direction =  lincomb(1, g.player, -1, m.position)  as point;
        g.move_wall(m.position,lincomb(1, m.position, 1 ,direction) as point, m.attrib["lunge speed"]); 
        m.attrib["angle"] = Math.atan2(direction[1], direction[0]);
    }
}



export function lunge_monster(m : monster, lunge_speed : number, lunge_radius : number){
    wander_monster(m);
    m.attrib["tick"].pop();
    m.attrib["lunge speed"] = lunge_speed
    m.attrib["lunge radius"] = lunge_radius;
    m.attrib["lunge duration"] = 30;
    m.attrib["lunge cooldown"] = 120;
    m.attrib["lunge start time"] = -1;
    m.attrib["tick"].push(lunge_tick);
}


export function vision(g : game, x : number, y : number, speed : number, vision_range : number, vision_arc : number){
    let m = new monster([x,y], "vision",a,b,c,d,e); 
    m.attrib["tick"] = [];
    m.attrib["speed"] = speed;
    lunge_monster(m, 8, 400);
    if(m.attrib["tick"].length != 1){
        throw "aere";
    }
    m.vision = {"vision_arc" : vision_arc, "vision_range" : vision_range, "direction" : 0};
    g.monsters.push(m);
}

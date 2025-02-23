// all these functions add a monster;

import { cross, dist, lincomb, moveIntoRectangleWH, moveTo, taxicab_dist } from "../lines";
import game, { fairy, monster, repel_spell } from "./game";

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
function b(this : monster ,g : game, type : attack_type){
    if(type != "swing"){
        if(taxicab_dist(this.position, type.position) > type.width * 2){
            return false;
        }
    }
    return true;
}; 
//hit
function c(this : monster ,g : game, type : attack_type){
    if(!(typeof type == "string") && type.type== "repel_spell"){
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
function e(this : monster, g : game){if(taxicab_dist( this.position, g.player) > 500){return}; for(let item of this.attrib["tick"]) { item(this, g)}};

/*
functions come in 3 kinds : 
the tick function itself (_tick), a function to make an arbitrary monster use that tick function (_monster), and a function that creates a new monster (no suffix);

the last two returns the monster 
*/

// tick attrib is an array of functions - args are (monster , game), that are called every single time

// make the monster wander 
// attrib: uses angle and angel_vel, must have speed
function wander_tick(m : monster|fairy , g:game){
    m.attrib["angle_vel"] += (Math.random()-0.5)*0.01;
    if(Math.abs(m.attrib["angle_vel"]) > 0.05){
        m.attrib["angle_vel"] = 0; 
    }
    m.attrib["angle"] += m.attrib["angle_vel"];
    let move_dest = lincomb(1,m.position, m.attrib["speed"], [Math.cos(m.attrib["angle"]),Math.sin(m.attrib["angle"])])  as point;
    if(m.attrib["ghost"]){
        m.position = move_dest;
    } else {
        g.move_wall(m.position, move_dest)
    }
    if(m instanceof monster && m.vision){
        m.vision.direction = m.attrib["angle"];
    }
}

function wander_monster(m : monster){
    m.attrib["angle"] = Math.random() * 360; 
    m.attrib["angle_vel"] = 0;
    m.attrib["tick"].push(wander_tick);
    return m
}

export function wanderer(g : game, x : number, y : number, speed : number){
    let m = new monster([x,y], "wanderer",a,b,c,d,e); 
    m.attrib["tick"] = [];
    m.attrib["speed"] = speed;
    wander_monster(m);
    g.monsters.push(m);
    return m;
}


// make the monster pursue the player (possibly with an offset) 
// attrib: uses angle and offset, must have speed
function pursue_tick(m : monster , g:game){
    let target_pt = lincomb(1, m.attrib["escort flag"]  ? (g.fairies.length > 0 ? g.fairies[0].position : g.escort_pos ):  g.player, 1, m.attrib["offset"]);

    let target = lincomb(1, target_pt , -1, m.position) as point; 
    let angle = m.attrib["angle"]
    let cross_prod  = cross([Math.cos(angle), Math.sin(angle), 0], [target[0], target[1], 0])[2]
    if(cross_prod > 0){
        angle += 0.01
    } else {
        angle -= 0.01
    }
    m.attrib["angle"] = angle
    let speed = m.attrib["speed"];
    if(dist(m.position, target_pt) < 7){
        speed = speed/3;
        [1,2,3].at.bind.call;
    }
    let move_dest  = lincomb(1,m.position, speed,[Math.cos(m.attrib["angle"]),Math.sin(m.attrib["angle"])]) as point;
    if(m.attrib["ghost"]){
        m.position = move_dest;
    } else {
        g.move_wall(m.position, move_dest)
    }
    if(m.vision){
        m.vision.direction = m.attrib["angle"];
    }
}

function pursue_monster(m : monster){
    m.attrib["angle"] = Math.random() * 360; 
    m.attrib["offset"] = [0,0];
    m.attrib["tick"].push(pursue_tick);
    m.attrib["escort flag"] = false; 
    return m;
}


export function pursue(g : game, x : number, y : number, speed : number){
    let m = new monster([x,y], "wanderer",a,b,c,d,e); 
    m.attrib["tick"] = [];
    m.attrib["speed"] = speed;
    pursue_monster(m);
    g.monsters.push(m);
    return m;
}

// lunge towards the player every once in a while
export function lunge_tick(m : monster, g : game){
    let a = m.attrib; 
    let distance = dist(m.position, g.player);

    let can_lunge = g.time >= a["lunge duration"] + a["lunge cooldown"] + a["lunge start time"]  || g.time <= a["lunge start time"] + a["lunge duration"]
    if(!can_lunge || distance > m.attrib["lunge radius"] ){
        wander_tick(m, g);
        a["lunging"] = false;
    } else { 
        if(g.time >= a["lunge duration"] + a["lunge cooldown"] + a["lunge start time"]){
            a["lunge start time"] = g.time;
        }
        a["lunging"] = true;
        let direction =  lincomb(1, g.player, -1, m.position)  as point;
        g.move_wall(m.position,lincomb(1, m.position, 1 ,direction) as point, m.attrib["lunge speed"]); 
        m.attrib["angle"] = Math.atan2(direction[1], direction[0]);
    }
}


export function lunge_monster(m : monster){
    wander_monster(m);
    m.attrib["tick"].pop();
    m.attrib["lunge speed"] = 8
    m.attrib["lunge radius"] = 400;
    m.attrib["lunge duration"] = 30;
    m.attrib["lunge cooldown"] = 120;
    m.attrib["lunge start time"] = -1;
    m.attrib["tick"].push(lunge_tick);
    return m;
}

//shoot lasers
export function laser_tick(m : monster, g : game ){
    if(Math.random() < 0.002 || g.time ==1){ // once every 10 seconds -> 1/600 = 0.0016666...
        m.lasering = {"type" : "threat", "time":120, "active_time":60, "direction" : Math.random() *2 * Math.PI, "range":3000};
    }
}

export function laser_tick_player(m : monster, g : game ){
    if(Math.random() < 0.002 || g.time ==1){ // once every 10 seconds -> 1/600 = 0.0016666...
        let d = lincomb(1, g.player,-1,m.position)
        m.lasering = {"type" : "threat", "time":120, "active_time":60, "direction" : Math.atan2(d[1], d[0]), "range":3000};
    }
}

export function forward_tick(m : monster, g : game){
    m.position = lincomb(1, m.position, 1, m.attrib["direction"]) as point;
    if(m.age > 100){
        m.active = false;
    }
}
export function forward(g : game, x : number, y : number, dx : number, dy : number){
    let m = new monster([x,y], "forward", a,b,c,d,e);
    m.attrib["tick"] = [forward_tick];
    m.attrib["direction"] = [dx,dy];
    m.attrib["angle"] = Math.atan2(dy,dx);
    g.monsters.push(m);
    
    m.dont_count = true; 
    return m;
}

//shoot lasers
export function shoot_tick(m : monster, g : game ){
    if(Math.random() < 0.03){ // once every 10 seconds -> 1/600 = 0.0016666...
        let angle = Math.random() * 2 * Math.PI
        let bullet = forward(g, m.position[0], m.position[1], 12*Math.cos(angle), 12*Math.sin(angle));     
        bullet.dont_count = true; 
        bullet.hit = function(){};
        bullet.name = "bullet";
    }
}

export function shoot_bullets(m : monster){
    m.attrib["tick"].push(shoot_tick)
    return m;
}



export function laser_monster(m : monster){
    m.attrib["tick"].push(laser_tick);
    return m;
}
/*
new fairy(position: point, name: string, should_check: (g: game, type: attack_type | monster) => boolean, hit: (g: game) => void, touch_player: (g: game) => void, tick_fn: (g: game) => void, monster_touch: (g: game, m: monster) => void): fairy
*/
export function base_fairy(g : game, x : number, y : number){
    let f = new fairy([x, y], "fairy", ()=>true,(g) => g.player_hits++, ()=>{},function(this : fairy,g:game){ wander_tick(this,g); this.position = moveIntoRectangleWH(this.position, 200,200,200,200) as point}, (g) => g.player_hits++);
    f.attrib["angle"] = Math.random() * 360; 
    f.attrib["angle_vel"] = 0;
    f.attrib["speed"] = 3;
    g.fairies.push(f);
}
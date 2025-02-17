import _ from "lodash";
import { game_interface, point } from "../interfaces";
import { dist, lincomb, moveIntoRectangleWH, moveTo, pointInsidePolygon, vector_angle } from "../lines";
import { rotate_command, scale_command } from "../rotation";

class seeing_monster {
    position:point;
    direction:number;
    vision_range:number;
    vision_arc:number;
    vision_velocity : number = 0; 
    constructor(position : point,direction : number,vision_range : number,vision_arc : number){
        this.position=position;
        this.direction=direction;
        this.vision_range=vision_range;
        this.vision_arc=vision_arc;

    }
}

let canonical_repel : draw_command = {"type":"drawBezierShape","x":0,"y":-50.00000000000001,"curves":[[4,-39.10256410256411,6,-26.923076923076927,3,-11.53846153846154],[5,-3.8461538461538467,8,-1.2820512820512822,11,0],[8,1.2820512820512822,5,3.8461538461538467,3,11.53846153846154],[6,26.923076923076927,4,39.10256410256411,0,50.00000000000001],[20,39.10256410256411,30,26.923076923076927,15,11.53846153846154],[25,3.8461538461538467,24,1.2820512820512822,22,0],[24,-1.2820512820512822,25,-3.8461538461538467,15,-11.53846153846154],[30,-26.923076923076927,20,-39.10256410256411,0,-50.00000000000001]],"color":{"type":"fill_linear","x0":0,"y0":0,"x1":11,"y1":0,"colorstops":[[0,"#ffffff"],[0.9,"#ccccff"],[1,"#bbbbff"]]}}

export class repel_spell {
    position:point;
    velocity:point;
    width:number;
    draw : draw_command
    constructor(position : point,velocity : point,width : number){
        this.position=position;
        this.velocity=velocity;
        this.width=width;
        this.draw = rotate_command(scale_command(canonical_repel, [0,0], 1, width/100), [0,0], Math.atan2(velocity[1], velocity[0]))
    }
}


export function repel_monster(x : point | seeing_monster, y : repel_spell) {
    // move monster in direction of repel spell
    let position : point = [0,0];
    if(x instanceof seeing_monster){
        position = x.position
    } else {
        position = x;
    }
    position = lincomb(1, position, 1, y.velocity) as point;
    return position; 
}


class game implements game_interface{
    player : point = [400,400];
    monsters : point[] = [];
    dims : point = [0,0]; // width, height
    target : point = [400, 400];
    trees : point[] = []; 
    seen_time : number = 0;
    seeing_monsters : seeing_monster[] = []; 
    repel_spells : repel_spell[] = []; 
    mode : "chase" | "move" | "stealth" | "repel" = "chase"; 
    time : number = 0; 
    constructor(){} ; // no constructor 
    
    setup_chase(w : number, h : number){
        this.time = 0;
        this.mode = "chase";
        this.player = [w/2, h/2];
        this.target = [w/2, h/2];
        this.monsters = [];
        this.trees = [];
        for(let i=0; i<30; i++){
            //add a monster
            this.monsters.push([Math.random() * w, Math.random() * h]);
        }
        for(let i=0; i<130; i++){
            //add a monster
            this.trees.push([Math.random() * w, Math.random() * h]);
        }

        this.dims = [w,h]; 
    }
    setup_move(w : number, h : number){
        this.time = 0;
        this.mode = "move";
        this.dims = [w, h];
        this.player = [0,0];
    }
    setup_stealth(w : number, h : number){
        this.time = 0;
        this.mode = "stealth";
        this.dims = [w, h];
        this.player = [w/2, h/2];
        this.target = [w/2, h/2];
        this.trees = [];
        this.seeing_monsters = [];
        this.seen_time = 0;
        for(let i=0; i<30; i++){
            //add a monster
            this.seeing_monsters.push(new seeing_monster([Math.random() * w, Math.random() * h], Math.random() * 2 * Math.PI, 300, 0.5 + Math.random() * 0.3));
        }
        for(let i=0; i<130; i++){
            //add a monster
            this.trees.push([Math.random() * w, Math.random() * h]);
        }
    }
    setup_repel(){
        this.time = 0;
        this.mode = "repel";
        this.repel_spells = []; 
        this.monsters = []; 
        this.seeing_monsters = []; 
        this.player = [0,0];
        this.target = [0,0];
        for(let i=0; i<30; i++){
            //add a monster
            this.monsters.push([Math.random() * 600 - 300, Math.random() * 600 - 300]);
        }

    }
    tick(){
        this.time++;
        if(this.mode == "chase"){
            return this.tick_chase();
        } else if (this.mode == "move"){    
            return [];
        } else if (this.mode == "stealth"){
            return this.tick_stealth()
        } else if (this.mode == "repel"){
            return this.tick_repel(); 
        }
        return []; 
    }

    move_player(input : point){
        if(this.mode == "move"){
            this.player = lincomb(1, this.player, 1, input) as point;
            this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;
        }
    }

    tick_chase(){
        // move to target 
        this.player = moveTo(this.player, this.target,15) as point; 
        //console.log(lincomb(1, this.target, -1, this.player))
        //console.log([this.player, this.target].toString())
        for(let i=0; i<this.monsters.length; i++){
            let monster = this.monsters[i];
            if(dist(monster, this.player) < 600){
                // pursue the player
                this.monsters[i] = moveTo(monster, this.player, 4) as point; 
            } else {
                this.monsters[i] = [monster[0] + (Math.random() - 0.5) * 7, monster[1] + (Math.random() - 0.5) * 7]
            }
            this.monsters[i] = moveIntoRectangleWH(this.monsters[i], [0,0], this.dims) as point; 
        }
        // inside box 
        this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;      
        return [];
    }
    tick_stealth(){
        this.player = moveTo(this.player, this.target,15) as point;
        let seen = false;  
        for(let monster of this.seeing_monsters){
            monster.position = lincomb(1, monster.position, 1, [Math.cos(monster.direction), Math.sin(monster.direction)]) as point;
            monster.vision_velocity += (Math.random() - 0.5) * 0.1;
            if(Math.abs(monster.vision_velocity) > 0.04){
                monster.vision_velocity = 0;
            }
            
            monster.direction += monster.vision_velocity;

            monster.position = moveIntoRectangleWH(monster.position, [0,0], this.dims) as point;
            if(!seen && dist(this.player, monster.position) < monster.vision_range && vector_angle(lincomb(1, this.player, -1, monster.position) as point, [Math.cos(monster.direction), Math.sin(monster.direction)]) <= monster.vision_arc){
                seen = true; 
            }
        }
        if(seen){
            this.seen_time ++;
        } else {
            this.seen_time = 0;
        }
        this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;      
        return [];
    }

    tick_repel(){
        // move monster
        let i = 0; 
        for(let item of this.monsters){
            let target = lincomb(1, [0,0], 60 + 2*i, [Math.cos(this.time/100 + i ), Math.sin(this.time/100 + i)])
            let v = moveTo(item, target, 5); 
            item[0] = v[0];
            item[1] = v[1]; 
            i++;
        }

        // repel monsters
        for(let item of this.repel_spells){
            item.position = lincomb(1, item.position, 1, item.velocity) as point; 
            for(let item2 of this.monsters){
                if(dist(item.position, item2) < item.width){
                    let v = repel_monster(item2, item);
                    item2[0] = v[0];
                    item2[1] = v[1];
                }
            }
        }
        for(let m of this.monsters){
            let moved = moveIntoRectangleWH(m, -300,-300,600,600);
            m[0] = moved[0];
            m[1] = moved[1]; 
        }

        return []
    }
}

export default game; 
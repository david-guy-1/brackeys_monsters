import _ from "lodash";
import { game_interface, point } from "../interfaces";
import { dist, lincomb, moveIntoRectangleWH, moveTo, pointInsidePolygon, vector_angle } from "../lines";

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

class game implements game_interface{
    player : point = [400,400];
    monsters : point[] = [];
    dims : point = [0,0]; // width, height
    target : point = [400, 400];
    trees : point[] = []; 
    seen_time : number = 0;
    seeing_monsters : seeing_monster[] = []; 
    mode : "chase" | "move" | "stealth"= "chase"; 

    constructor(){} ; // no constructor 
    
    setup_chase(w : number, h : number){
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
        this.mode = "move";
        this.dims = [w, h];
        this.player = [0,0];
    }
    setup_stealth(w : number, h : number){
        this.mode = "stealth";
        this.dims = [w, h];
        this.player = [w/2, h/2];
        this.target = [w/2, h/2];
        this.trees = [];
        this.seeing_monsters = [];
        for(let i=0; i<30; i++){
            //add a monster
            this.seeing_monsters.push(new seeing_monster([Math.random() * w, Math.random() * h], Math.random() * 2 * Math.PI, 300, 0.5 + Math.random() * 0.3));
        }
        for(let i=0; i<130; i++){
            //add a monster
            this.trees.push([Math.random() * w, Math.random() * h]);
        }
        
    }
    tick(){
        if(this.mode == "chase"){
            return this.tick_chase();
        } else if (this.mode == "move"){    
            return [];
        } else if (this.mode == "stealth"){
            return this.tick_stealth()
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
                this.monsters[i] = moveTo(monster, this.player, 10) as point; 
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
            console.log(seen);
        }
        this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;      
        return [];
    }
}

export default game; 
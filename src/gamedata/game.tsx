import _ from "lodash";
import { game_interface, point } from "../interfaces";
import { dist, lincomb, moveIntoRectangleWH, moveTo } from "../lines";

class chase_game implements game_interface{
    player : point = [400,400];
    monsters : point[] = [];
    dims : point = [0,0]; // width, height
    target : point = [400, 400];
    trees : point[] = []; 
    mode : "chase" | "move" = "chase"; 

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

    tick(){
        if(this.mode == "chase"){
            return this.tick_chase();
        } else if (this.mode == "move"){
            
            return [];
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
        this.player = moveTo(this.player, this.target,30) as point; 
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
}

export default chase_game; 
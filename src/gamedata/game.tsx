import _ from "lodash";
import { game_interface, point } from "../interfaces";
import { dist, moveTo } from "../lines";

class game implements game_interface{
    points : point[] = [];
    collected : boolean[] = [];
    player : point = [400,400];
    target : point = [400, 400];
    exit : point = [Math.random() * 600, Math.random() * 600]
    completed : boolean = false;
    constructor(){
        for(let i=0; i<10; i++){
            this.points.push([Math.random() * 600, Math.random()*600]);
            this.collected.push(false);
        }
        this.player = [400, 400];
    }
    tick(){
        //console.log("ticked");
        let collected_this_frame : number[]  = []
        let target = moveTo(this.player, this.target, 10) as point; 
        this.player = target;
        // check collected
        for(let i=0; i<this.points.length; i++){
            if(this.collected[i]){
                continue
            }
            if(dist(this.player, this.points[i]) < 10){
                this.collected[i] = true;
                collected_this_frame.push(i);
            }
        }
        if(_.every(this.collected) && dist(this.player, this.exit) < 10){
            this.completed = true; 
        }
        return collected_this_frame; 
    }
}

export default game; 
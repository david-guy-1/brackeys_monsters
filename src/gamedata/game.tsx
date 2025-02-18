import _ from "lodash";
import { game_interface, point } from "../interfaces";
import { dist, lincomb, move_lst, moveIntoRectangleWH, moveTo, normalize, pointInsidePolygon, vector_angle } from "../lines";
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
class roaming_monster {
    position:point;
    target:point;
    w:number;
    h:number;
    speed:number;

    constructor(position : point,target : point,w : number,h : number,speed : number){
        this.position=position;
        this.target=target;
        this.w=w;
        this.h=h;
        this.speed=speed;

    }
    tick(){
        this.position = moveTo(this.position, this.target, this.speed) as point;
        if(dist(this.position, this.target) < 1){
            this.target = [Math.random() * this.w , Math.random() * this.h]; 
        }
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
    //fundamentals 
    dims : point = [0,0]; // width, height
    mode : "chase" | "move" | "stealth" | "repel" | "escort" = "chase"; 
    time : number = 0;

    // player movement
    player : point = [400,400];
    target : point = [400, 400];

    //monsters
    monsters : point[] = [];
    seeing_monsters : seeing_monster[] = []; 
    roaming_monsters : roaming_monster[] = []; 
    
    // common stuff
    trees : point[] = []; 
    seen_time : number = 0;
    repel_spells : repel_spell[] = []; 
    
    // escort stuff
    escort_points : point[] = [];
    escort_next_point : number = 0;
    escort_pos : point  = [0,0];
    escort_speed : number = 0; 


    constructor(){} ; // no constructor 
    clear(){
        this.trees = [];
        this.seen_time = 0;
        this.seeing_monsters = []
        this.repel_spells = [];
        this.time = 0; 
        this.escort_points = [];
    }
    setup_chase(w : number, h : number){
        this.clear()
        this.mode = "chase";
        this.player = [w/2, h/2];
        this.target = [w/2, h/2];
        for(let i=0; i<30; i++){
            //add a monster
            this.monsters.push([Math.random() * w, Math.random() * h]);
        }
        for(let i=0; i<130; i++){
            //add a tree
            this.trees.push([Math.random() * w, Math.random() * h]);
        }

        this.dims = [w,h]; 
    }
    setup_move(w : number, h : number){
        this.clear()
        this.mode = "move";
        this.dims = [w, h];
        this.player = [0,0];
    }
    setup_stealth(w : number, h : number){
        this.clear()
        this.mode = "stealth";
        this.dims = [w, h];
        this.player = [w/2, h/2];
        this.target = [w/2, h/2];
        for(let i=0; i<30; i++){
            //add a monster
            this.seeing_monsters.push(new seeing_monster([Math.random() * w, Math.random() * h], Math.random() * 2 * Math.PI, 300, 0.5 + Math.random() * 0.3));
        }
        for(let i=0; i<130; i++){
            //add a tree
            this.trees.push([Math.random() * w, Math.random() * h]);
        }
    }
    setup_repel(w : number,h : number){
        this.clear()
        this.mode = "repel";
        this.dims = [w,h];
        this.player = [0,0];
        this.target = [0,0];
        for(let i=0; i<30; i++){
            //add a monster
            this.monsters.push([Math.random() * w - w/2, Math.random() * h - h/2]);
        }

    }
    setup_escort(w : number,h : number, escort_points : point[], speed : number){
        this.clear()
        this.mode = "escort";
        this.dims = [w,h];
        this.player = [...escort_points[0]];
        this.target = [...escort_points[0]];
        this.escort_points = escort_points; 
        this.escort_next_point = 0;
        this.escort_speed = speed;  
        this.escort_pos = [...escort_points[0]]; 
        for(let i=0; i<30; i++){
            //add a monster
            this.roaming_monsters.push(new roaming_monster([Math.random(),Math.random()], [Math.random(), Math.random()], w, h , 14));
        }
        for(let i=0; i<130; i++){
            //add a tree
            this.trees.push([Math.random() * w, Math.random() * h]);
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
        else if (this.mode == "escort"){
            return this.tick_escort(); 
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
        this.roaming_monsters.forEach(x => x.tick());
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
        this.roaming_monsters.forEach(x => x.tick());
        for(let monster of this.seeing_monsters){
            // move monster 
            monster.position = lincomb(1, monster.position, 1, [Math.cos(monster.direction), Math.sin(monster.direction)]) as point;
            monster.position = moveIntoRectangleWH(monster.position, [0,0], this.dims) as point;

            //turn monster
            monster.vision_velocity += (Math.random() - 0.5) * 0.1;
            if(Math.abs(monster.vision_velocity) > 0.04){
                monster.vision_velocity = 0;
            }
            monster.direction += monster.vision_velocity;
        }
        this.handle_repel();

        
        if(this.seeing_monster_see_player(true).length != 0){
            this.seen_time ++;
        }else {
            this.seen_time = 0; 
        }

        this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;      
        return [];
    }

    tick_repel(){ //
        // move monster
        let i = 0; 
        this.roaming_monsters.forEach(x => x.tick());
        for(let item of this.monsters){
            let target = lincomb(1, [0,0], 60 + 2*i, [Math.cos(this.time/100 + i ), Math.sin(this.time/100 + i)])
            
            let v = moveTo(item, target, 5); 
            move_lst(item,v);
            i++;
        }

        this.handle_repel();
        for(let m of this.monsters){
            let moved = moveIntoRectangleWH(m, -this.dims[0]/2,-this.dims[1]/2,this.dims[0],this.dims[1]);
            move_lst(m, moved);
        }

        return []
    }
    tick_escort(){
        this.player = moveTo(this.player, this.target,15) as point; 
        
        let next_point = this.escort_points[this.escort_next_point];
        this.escort_pos = moveTo(this.escort_pos, next_point, this.escort_speed) as point;
        // move the escorted person 
        if(dist(this.escort_pos, next_point) < 1){
            if(this.escort_next_point < this.escort_points.length-1){
                this.escort_next_point++;
            }
        }
        // move monsters
        this.roaming_monsters.forEach(x => x.tick());
        return [];
    }
    cast_repel_spell (x : number, y : number, width : number = 100, velocity : number = 10){
        let v = normalize ([x,y], velocity) as point; 
        this.repel_spells.push(new repel_spell(this.player, v, width));
    }
    seeing_monster_see_player(firstone : boolean = false) : number[]{ // indices of monsters that see the player
        let seen = [];
        for(let i=0; i < this.seeing_monsters.length; i++){
            let monster = this.seeing_monsters[i];
            if(dist(this.player, monster.position) < monster.vision_range && vector_angle(lincomb(1, this.player, -1, monster.position) as point, [Math.cos(monster.direction), Math.sin(monster.direction)]) <= monster.vision_arc){
                seen.push(i);
                if(firstone){
                    return seen; 
                } 
            }
        }
        return seen; 
    }
    handle_repel(){
        // repel monsters
        for(let item of this.repel_spells){
            item.position = lincomb(1, item.position, 1, item.velocity) as point; 
            for(let item2 of this.monsters){
                if(dist(item.position, item2) < item.width){
                    move_lst(item2,  repel_monster(item2, item));
                }
            }
            for(let item2 of this.seeing_monsters){
                if(dist(item.position, item2.position) < item.width){
                    move_lst(item2.position,  repel_monster(item2, item));
                    item2.direction = Math.atan2(item.velocity[1], item.velocity[0]);
                }
            }
            for(let item2 of this.roaming_monsters){
                if(dist(item.position, item2.position) < item.width){
                    move_lst(item2.position,  repel_monster(item2.position, item));
                }
            }
        }
    }
}

export default game; 
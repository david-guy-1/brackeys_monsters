import _, { flatten } from "lodash";
import { game_interface, point } from "../interfaces";
import { dist, doLinesIntersect, getIntersection, lerp, lincomb, move_lst, moveIntoRectangleWH, moveTo, normalize, pointInsidePolygon, pointToCoefficients, vector_angle } from "../lines";
import { rotate_command, scale_command } from "../rotation";

class monster { 
    position : point;
    name : string
    age : number = 0;
    constructor(position : point, name : string = ""){
        this.position = position; 
        this.name = name;
    }
    tick(g : game){
        this.age++;
    }
}

class seeing_monster extends monster{
    direction:number;
    vision_range:number;
    vision_arc:number;
    vision_velocity : number = 0; 
    name : string = ""
    constructor(position : point,direction : number,vision_range : number,vision_arc : number, name : string = ""){
        super(position,name);
        this.direction=direction;
        this.vision_range=vision_range;
        this.vision_arc=vision_arc;
        this.name = name
    }
    tick(g : game){
        this.age++
        // move this 
        g.move_wall(this.position, lincomb(1, this.position, 1, [Math.cos(this.direction), Math.sin(this.direction)]) as point)
        //turn this
        this.vision_velocity += (Math.random() - 0.5) * 0.1;
        if(Math.abs(this.vision_velocity) > 0.04){
            this.vision_velocity = 0;
        }
        this.direction += this.vision_velocity;
    }
}
class roaming_monster extends monster {
    target:point;
    w:number;
    h:number;
    speed:number;
    name : string = ""
    constructor(position : point,target : point,w : number,h : number,speed : number, name : string = ""){
        super(position,name);
        this.position=position;
        this.target=target;
        this.w=w;
        this.h=h;
        this.speed=speed;
        this.name = name

    }
    tick(g : game){
        this.age++
        g.move_wall(this.position, this.target, this.speed);
        if(dist(this.position, this.target) < 1){
            this.target = [Math.random() * this.w , Math.random() * this.h]; 
        }
    }
}
class targeted_monster extends monster{
    target:point;
    speed:number;
    name : string = ""
    constructor(position : point,target : point,speed : number, name : string = ""){
        super(position,name);
        this.position=position;
        this.target=target;
        this.speed=speed;
        this.name = name
    }
    tick(g : game){
        this.age++
        g.move_wall(this.position, this.target, this.speed);
    }
}

let canonical_repel : draw_command = {"type":"drawBezierShape","x":0,"y":-50.00000000000001,"curves":[[4,-39.10256410256411,6,-26.923076923076927,3,-11.53846153846154],[5,-3.8461538461538467,8,-1.2820512820512822,11,0],[8,1.2820512820512822,5,3.8461538461538467,3,11.53846153846154],[6,26.923076923076927,4,39.10256410256411,0,50.00000000000001],[20,39.10256410256411,30,26.923076923076927,15,11.53846153846154],[25,3.8461538461538467,24,1.2820512820512822,22,0],[24,-1.2820512820512822,25,-3.8461538461538467,15,-11.53846153846154],[30,-26.923076923076927,20,-39.10256410256411,0,-50.00000000000001]],"color":{"type":"fill_linear","x0":0,"y0":0,"x1":11,"y1":0,"colorstops":[[0,"#ffffff"],[0.9,"#ccccff"],[1,"#bbbbff"]]}}

let canonical_fireball : draw_command = {"type":"drawBezierShape","x":-26.7,"y":-24,"curves":[[-17.7,-28.2,-0.6,-33.3,18.599999999999998,-29.099999999999998],[28.799999999999997,-24.9,37.199999999999996,-16.5,40.8,-6.3],[43.8,3.5999999999999996,38.4,15.6,27.599999999999998,24.3],[19.5,29.7,13.799999999999999,31.799999999999997,5.7,31.5],[-2.1,31.799999999999997,-11.4,30,-20.4,26.7],[-26.4,25.5,-30.599999999999998,25.5,-38.699999999999996,23.4],[-45.6,22.2,-51,21.3,-61.199999999999996,20.7],[-45.9,19.2,-38.699999999999996,17.4,-31.5,17.4],[-41.1,15,-48.6,13.5,-60.3,11.1],[-49.5,8.4,-43.8,8.4,-33,4.5],[-40.8,3.3,-48.6,3.5999999999999996,-61.8,1.5],[-57,-0.3,-48.6,-1.2,-33.3,-3.9],[-40.5,-6.6,-47.699999999999996,-6.6,-61.8,-8.7],[-53.1,-12,-44.4,-15,-34.8,-20.4]],"color":{"type":"fill_radial","x0":0,"y0":0,"r0":0.3,"x1":0,"y1":0,"r1":42,"colorstops":[[0,"white"],[0.3,"yellow"],[1,"red"]]}};


export class repel_spell {
    position:point;
    velocity:point;
    width:number;
    draw : draw_command;
    lifespan : number; 
    constructor(position : point,velocity : point,width : number, lifespan : number){
        this.position=position;
        this.velocity=velocity;
        this.width=width;
        this.lifespan = lifespan; 
        this.draw = rotate_command(scale_command(canonical_repel, [0,0], 1, width/100), [0,0], Math.atan2(velocity[1], velocity[0]))
    }
    tick(){
        this.lifespan--;
    }
}

export class fireball_spell {
    position:point;
    velocity:point;
    width:number;
    draw : draw_command;
    lifespan : number; 
    constructor(position : point,velocity : point,width : number, lifespan : number){
        this.position=position;
        this.velocity=velocity;
        this.width=width;
        this.lifespan = lifespan; 
        this.draw = rotate_command(scale_command(canonical_fireball, [0,0],  width/100, width/100), [0,0], Math.atan2(velocity[1], velocity[0]))
    }
    tick(){
        this.lifespan--;
    }
}


export function repel_monster(x : point, y : repel_spell) {
    // move monster in direction of repel spell
    let position = lincomb(1, x, 0.9, y.velocity) as point;
    return position; 
}


class game implements game_interface{
    //fundamentals 
    dims : point = [0,0]; // width, height
    mode : "chase" | "move" | "stealth" | "repel" | "escort" | "collect" = "chase"; 
    time : number = 0;

    // player movement
    player : point = [400,400];
    target : point = [400, 400];

    //monsters
    monsters : monster[] = [];
    seeing_monsters : seeing_monster[] = []; 
    roaming_monsters : roaming_monster[] = []; 
    targeted_monsters : targeted_monster[] = [];

    // common stuff
    trees : point[] = []; 
    seen_time : number = 0;
    repel_spells : repel_spell[] = []; 
    fireball_spells : fireball_spell[] = [];
    walls : [point, point][]  = []; 
    // escort stuff
    escort_points : point[] = [];
    escort_next_point : number = 0;
    escort_pos : point  = [0,0];
    escort_speed : number = 0; 

    // coin stuff
    coin_points : point[] = []; 
    collected : boolean[] = [];

    constructor(){} ; // no constructor 
    clear(){
        this.monsters = []; 
        this.seeing_monsters = [];
        this.roaming_monsters = [];
        this.targeted_monsters = []; 
        this.trees = [];
        this.repel_spells = [];
        this.fireball_spells = [];
        this.seen_time = 0;
        this.walls = [];
        this.time = 0; 
        this.escort_points = [];
        this.coin_points = [];
        this.collected = []; 
    }
    setup_chase(w : number, h : number){
        this.clear()
        this.mode = "chase";
        this.player = [w/2, h/2];
        this.target = [w/2, h/2];
        for(let i=0; i<30; i++){
            //add a monster
            this.monsters.push(new monster([Math.random() * w, Math.random() * h]));
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
            this.monsters.push(new monster([Math.random() * w - w/2, Math.random() * h - h/2]));
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
            this.roaming_monsters.push(new roaming_monster([Math.random(),Math.random()], [Math.random(), Math.random()], w, h , 4));
        }
        for(let i=0; i<130; i++){
            //add a tree
            this.trees.push([Math.random() * w, Math.random() * h]);
        }
        for(let i=0; i<30; i++){
            //add a tree
            this.coin_points.push([Math.random() * w, Math.random() * h]);
            this.collected.push(false)
        }
    }
    setup_collect(w : number,h : number, ){
        this.clear()
        this.mode = "collect";
        this.dims = [w,h];
        this.walls.push([[100,100],[700,400]]);
        //coins
        for(let i=0; i<30; i++){
            this.coin_points.push([Math.random() * w, Math.random() * h]);
            this.collected.push(false)
        }
        //monsters
        for(let i=0; i<100; i++){
            let spawn = [Math.random() * w, Math.random() * h];
            this.targeted_monsters.push(new targeted_monster([...spawn] as point, [...spawn] as point, 3 + 4 * Math.random())); 
        }
    }
    // discrete move;

    move_player_disc(input : point){
        if(this.mode == "move"){
            this.player = lincomb(1, this.player, 1, input) as point;
            this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;
        }
    }

    tick(){
        this.time++;
        // default actions, for any "moving" stuff
        if("chase stealth repel escort collect".split(" ").indexOf(this.mode) != -1){
            this.move_wall(this.player, this.target,15) ; 
            this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;   
            this.seeing_monsters.forEach(x => x.tick(this));
            this.roaming_monsters.forEach(x => x.tick(this));
            this.targeted_monsters.forEach(x => x.tick(this));
            this.handle_repel();
            this.handle_fireball();
            this.handle_collect();
            this.clear_deleted_monsters();
        }
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
        else if (this.mode == "collect"){
            return this.tick_collect(); 
        }
        return []; 
    }



    tick_chase(){
        for(let i=0; i<this.monsters.length; i++){
            let monster = this.monsters[i];
            if(dist(monster.position, this.player) < 600){
                // pursue the player
                this.move_wall(monster.position, this.player, 4); 
            } else {
                this.move_wall(monster.position, lincomb(1, monster.position, 7, [Math.random() - 0.5,Math.random() - 0.5]) as point);  
            }
            this.monsters[i].position = moveIntoRectangleWH(this.monsters[i].position, [0,0], this.dims) as point; 
        } 
        return [];
    }
    tick_stealth(){
        
        if(this.seeing_monster_see_player(true).length != 0){
            this.seen_time ++;
        }else {
            this.seen_time = 0; 
        }
           
        return [];
    }

    tick_repel(){ //
        // move monster
        let i = 0; 
        for(let item of this.monsters){
            let target = lincomb(1, [0,0], 60 + 2*i, [Math.cos(this.time/100 + i ), Math.sin(this.time/100 + i)]) as point;            
            this.move_wall(item.position, target, 5);
            item.position =  moveIntoRectangleWH(item.position, -this.dims[0]/2,-this.dims[1]/2,this.dims[0],this.dims[1]) as point;
            i++;
        }
        return []
    }
    tick_escort(){
        // move the escorted person 
        let next_point = this.escort_points[this.escort_next_point];
        this.escort_pos = moveTo(this.escort_pos, next_point, this.escort_speed) as point;
        if(dist(this.escort_pos, next_point) < 1){
            if(this.escort_next_point < this.escort_points.length-1){
                this.escort_next_point++;
            }
        }
        return [];
    }
    tick_collect(){
        // move the escorted person 
        let get_nearest_coin = function(this:game, p : point){
            let min_dist = Number.POSITIVE_INFINITY; 
            let closest = -1; 
            for(let [i, coin ] of this.coin_points.entries()){
                if(this.collected[i]){
                    continue;
                }
                let d = dist(p, coin);
                if(d < min_dist){
                    closest = i;
                    min_dist = d; 
                }
            }
            return closest;
        }.bind(this);

        for(let monster of this.targeted_monsters){
            if(dist(monster.position, monster.target) < 4){
                let coin = get_nearest_coin(monster.position)
                if(coin != -1){
                    monster.target = lincomb(1, this.coin_points[coin], 280, [Math.random() -0.5,Math.random() -0.5]) as point;
                }
            }
        }
        return [];
    }
    // all of these are WORLD (not canvas) coordinates , the game doesn't even know there is a canvas! 
    cast_repel_spell (x : number, y : number,  lifespan : number, width : number = 100, velocity : number = 10){
        let v = normalize ([x,y], velocity) as point; 
        this.repel_spells.push(new repel_spell(this.player, v, width, lifespan));
    }

    cast_fireball_spell (x : number, y : number,  lifespan : number, width : number = 100, velocity : number = 10){
        let v = normalize ([x,y], velocity) as point; 
        this.fireball_spells.push(new fireball_spell(this.player, v, width, lifespan));
        
    }

    seeing_monster_see_player(firstone : boolean = false) : number[]{ // indices of monsters that see the player
        let seen = [];
        for(let [i, monster] of this.seeing_monsters.entries()){
            if(dist(this.player, monster.position) < monster.vision_range && (dist(this.player, monster.position) == 0 || vector_angle(lincomb(1, this.player, -1, monster.position) as point, [Math.cos(monster.direction), Math.sin(monster.direction)]) <= monster.vision_arc)){
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
            item.tick();
            for(let item2 of this.monsters.concat(this.seeing_monsters).concat(this.roaming_monsters).concat(this.targeted_monsters)){
                if(dist(item.position, item2.position) < item.width){
                    this.move_wall(item2.position, repel_monster(item2.position, item));
                }
                if(item2 instanceof seeing_monster){
                    item2.direction = Math.atan2(item.velocity[1], item.velocity[0]);
                }
            }
        }
        this.repel_spells = this.repel_spells.filter(x => x.lifespan > 0);
    }
    handle_fireball(){
        for(let item of this.fireball_spells){
            item.position = lincomb(1, item.position, 1, item.velocity) as point; 
            item.tick();
            for(let item2 of this.monsters.concat(this.seeing_monsters).concat(this.roaming_monsters).concat(this.targeted_monsters)){
                if(dist(item.position, item2.position) < item.width){
                    item2.name = "deleted " + item2.name; 
                }
            }
        }
        this.fireball_spells = this.fireball_spells.filter(x => x.lifespan > 0);
    }
    handle_collect(){
        for(let [i, coin] of this.coin_points.entries()){
            if(dist(this.player, coin) < 60) {
                this.collected[i] = true; 
            }
        }
    }
    // looks for "deleted" in name
    clear_deleted_monsters(){
        for(let lst of [this.monsters, this.seeing_monsters, this.roaming_monsters, this.targeted_monsters]){
            for(let i=lst.length-1; i>= 0; i--){
                if(lst[i].name.indexOf("deleted") != -1){
                    lst.splice(i,1);
                }
            }
        }
    }
    // mutates point 
    move_wall(point : point , target : point, amt? : number){
        if(amt != undefined){
            target = moveTo(point,target,amt) as point;
        }
        for(let w of this.walls){
            let wall = flatten(w)
            if(doLinesIntersect(point, target, wall)){
                let intersection = getIntersection(pointToCoefficients(point, target), pointToCoefficients(wall));
                // target = intersection + (start - intersection) normalized to 0.01
                target = lincomb(1, intersection, 1, normalize(lincomb(1, point, -1, intersection), 0.01)) as point; 
            }
        }
        move_lst(point, target)
    }
}

export default game; 
import _, { flatten } from "lodash";
import { game_interface, point } from "../interfaces";
import { angle_between, bfs, dist, doLinesIntersect, dot, getIntersection, len, lerp, lincomb, move_lst, moveIntoRectangleWH, moveTo, normalize, pointClosestToSegment, pointInsidePolygon, pointInsideRectangleWH, pointToCoefficients, rescale, vector_angle } from "../lines";
import { rotate_command, scale_command } from "../rotation";
import { d_image } from "../canvasDrawing";
import { dag } from "../dag";
import { canvas_size } from "./constants";

export function get_draw_commands(m : monster): draw_command[]{
    return [d_image("images/monster.png", m.position)];
}

export class monster { 
    position : point;
    name : string
    age : number = 0;
    active : boolean = true; 
    lasering : undefined | {"type" : "threat" , time : number, direction : number, range : number, active_time : number} | {"type" : "active", time : number,direction : number, range : number}; 
    attrib : Record<string, any> = {}; 
    constructor(position : point, name : string = ""){
        this.position = position; 
        this.name = name;
    }
    tick(g : game){
        this.age++;
        // handle lasers
        if(this.lasering != undefined){
            if(this.lasering.type == "threat"){
                this.lasering.time--;
                if(this.lasering.time == 0){
                    this.lasering = {type:"active", time : this.lasering.active_time, direction:this.lasering.direction, range:this.lasering.range};
                } 
            }else if (this.lasering.type == "active"){
                
                this.lasering.time--;
                if(this.lasering.time == 0){
                    this.lasering = undefined;
                }
            }
        }
    }
}


export class seeing_monster extends monster{
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
        super.tick(g); 
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
export class roaming_monster extends monster {
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
        super.tick(g); 
        g.move_wall(this.position, this.target, this.speed);
        if(dist(this.position, this.target) < 1){
            this.target = [Math.random() * this.w , Math.random() * this.h]; 
        }
    }
}
export class targeted_monster extends monster{
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
        super.tick(g); 
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

type swing_type = {"angle" : number, "velocity" : number, size : number, "lifespan" : number};

class game implements game_interface{
    //fundamentals 
    dims : point = [0,0]; // width, height
    mode : "chase" | "move" | "stealth" | "repel" | "escort" | "collect" | "maze" | "potions"= "chase"; 
    time : number = 0;

    // player movement
    player : point = [400,400];
    target : point = [400, 400];

    //monsters
    monsters : monster[] = [];

    swing : undefined | swing_type = undefined
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
    
    // maze stuff
    // re-use player, coin_points and dims
    maze_points : boolean[][] = []; // this is x,y (opposite of matrices)
    maze_chops : number = 0; 
    maze_chops_init : number = 0;

    // potions stuff
    rules : {type : "first" | "before"  | "last" , x : string, y : string | number}[] = [];
    potions : string[] = [];
    already_put : string[] = [];

    // dag 
    graph : dag
    towns : Record<string, Set<string>>; 
    collected_dag : Set<string> = new Set();
    town_locations : Record<string, point>; 
    constructor(){
        let n_vertices = 30; 
        this.graph = new dag(_.range(n_vertices).map(x => x.toString()), []);  
        for(let i=0; i<n_vertices; i++){
            try {
                this.graph.add_edge(Math.floor(Math.random() * n_vertices).toString(), Math.floor(Math.random() * n_vertices).toString());
                this.graph.add_edge(i.toString(), Math.floor(Math.random() * n_vertices).toString());

            }catch(e){

            }
        }
        while(true){
            let n_towns = Math.ceil(n_vertices/3);
            this.towns = {}; 
            for (let i=0 ;i<n_towns; i++){
                this.towns[i.toString()] = new Set(); 
            }
            for(let i=0; i<n_vertices; i++){
                this.towns[Math.floor(Math.random() * n_towns).toString()].add(i.toString());
                
            }
            if(_.every(Object.values(this.towns).map(x => x.size != 0))){
                break;
            }
        }
        this.town_locations = {};
        for(let item of Object.keys(this.towns)){
            while(true){
                let next_point : point = [Math.random() * canvas_size[0], Math.random() * canvas_size[1]];
                if(_.some(Object.values(this.town_locations).map(x => dist(x, next_point) < 100))){
                } else {
                    this.town_locations[item] = next_point;
                    break; 
                }
            }
        }
        console.log([this.towns, this.town_locations]);
    } ; 
    clear(){
        this.monsters = []; 
        this.trees = [];
        this.repel_spells = [];
        this.fireball_spells = [];
        this.seen_time = 0;
        this.walls = [];
        this.time = 0; 
        this.escort_points = [];
        this.coin_points = [];
        this.collected = []; 
        this.maze_points = []; 
        this.potions = []
        this.rules = [];
        this.already_put = []; 
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
            this.monsters.push(new seeing_monster([Math.random() * w, Math.random() * h], Math.random() * 2 * Math.PI, 300, 0.5 + Math.random() * 0.3));
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
            this.monsters.push(new roaming_monster([Math.random(),Math.random()], [Math.random(), Math.random()], w, h , 4));
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
            this.monsters.push(new targeted_monster([...spawn] as point, [...spawn] as point, 3 + 4 * Math.random())); 
        }
    }

    // discrete move;
    setup_maze(w : number, h : number){
        this.clear()
        this.mode = "maze";
        this.dims = [w,h];
        this.player = [0,0];
        for(let i=0; i < w; i++){
            this.maze_points.push([]);
            for(let j=0; j < h; j++){
                this.maze_points[i].push(Math.random() < 0.6); // random stuff
            }
        }
        this.maze_points[0][0] = false
        this.maze_points[w-1][h-1] = false
        let bfs_next = function(this:game, s : string ){
            let [x,y,chops] = JSON.parse(s); 
            if(x == w && y == h){
                return [];
            }
            let next_points = [[x, y+1], [x, y-1], [x-1, y], [x+1, y]].filter(([x,y]) => pointInsideRectangleWH(x,y,-0.01, -0.01, this.dims));
            let strings : string[] = []; 
            for(let [x2, y2] of next_points){
                if(this.maze_points[x2][y2]){
                    strings.push(JSON.stringify([x2, y2, chops+1])) 
                } else {
                    strings.push(JSON.stringify([x2, y2, chops])) 
                }
            }
            return strings; 
        }.bind(this);

        let result = bfs(bfs_next,JSON.stringify([0,0,0]), function(s : string){
            let [x,y,chops] = JSON.parse(s);
            return chops > w + h; 
        }); 
        this.maze_chops = _.min(result.map(x => JSON.parse(x)).filter(([a,b,c]) => a == w-1 && b == h-1).map(([a,b,c]) => c));
        this.maze_chops_init = this.maze_chops;

    }
    setup_potions(num_potions : number){
        this.clear()
        this.mode = "potions";
        // make potions
        if(num_potions <= 1){
            throw "need at least 2 potions"; 
        }
        let potions = [];
        for(let i=0; i < num_potions; i++){
            potions.push(`hsl(${Math.random() * 360}, 75%, 80% )`)
        }
        this.potions =  _.shuffle(potions).map(x => x.toString()); // correct value 
        console.log(potions);

        // generate rules to constrain potions
        while(this.rules.length < 12){
            let choice :  "first" | "before"  | "last"  = _.sample(["first", "before", "last",]); 
            // choose a potion to constrain 
            let index = Math.floor(Math.random() * num_potions)
            let constrained_potion = this.potions[index];
            if(choice == "first"){
                this.rules.push({type:"first", x : constrained_potion, y : Math.min(num_potions, Math.ceil(index * (1.2 + Math.random() * 0.3)))}); 
            }
            if(choice == "last" && index != 0){
                this.rules.push({type:"last", x : constrained_potion, y : Math.max(1, Math.floor(index * (0.8 - Math.random() * 0.2)))}); 
            }
            if(choice == "before"){
                let index2 = -1
                while(index2 == -1 || index == index2){
                    index2 = Math.floor(Math.random() * num_potions);
                }

                this.rules.push({type:"before", x : constrained_potion, y : this.potions[index2]}); 
            }
        }
        this.already_put = this.potions;
        if(!this.check_potions()){
            throw "failure to generate";
        }
        this.already_put = [];
    }

    add_potion(s : string){
        if(this.potions.indexOf(s) != -1 && this.already_put.indexOf(s) == -1){
            this.already_put.push(s);
        }
    }
    check_potions(){
        // first : strict inequality, last : non-strict inequality 
        let output : boolean[] = []; 
        for(let item of this.rules){
            let potion = item.x;
            let actual_index = this.already_put.indexOf(potion);
            if(item.type == "first"){
                let rule_index = item.y; 
                if(typeof rule_index == "string"){
                    throw "rule of type first with string "
                }
                output.push(actual_index != -1 && actual_index < rule_index)
            }
            else if(item.type == "last"){
                let rule_index = item.y; 
                if(typeof rule_index == "string"){
                    throw "rule of type last with string "
                }
                output.push(actual_index != -1 && actual_index >= rule_index)
            }
            else if (item.type == "before"){
                let other_index = this.already_put.indexOf(item.y.toString());
                output.push(actual_index != -1 && other_index != -1 && actual_index < other_index)
            }
        }
        return output; 
    }
    remove_last_potion(){
        if(this.already_put.length > 0){
            this.already_put.pop(); 
        }
    }

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
            this.get_monsters().forEach(x => x.tick(this));
            this.handle_repel();
            this.handle_fireball();
            this.handle_swing();
            this.handle_collect();
            this.handle_lasers();
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
            if(dist(monster.position, this.player) < 200){
                // pursue the player
                this.move_wall(monster.position, this.player, 4); 
            } else {
                this.move_wall(monster.position, lincomb(1, monster.position, 7, [Math.random() - 0.5,Math.random() - 0.5]) as point);  
            }
            this.monsters[i].position = moveIntoRectangleWH(this.monsters[i].position, [0,0], this.dims) as point; 
            // randomly laser
            if(Math.random() < 0.001){
                monster.lasering = {"type":"threat", "direction" : Math.random() * 2 * Math.PI, "range" : 1000, "time" : 50, "active_time" : 30};
            }
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

        for(let monster of this.monsters){
            if(monster instanceof targeted_monster &&  dist(monster.position, monster.target) < 4){
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
    start_swing(size : number, angle : number, lifespan : number, velocity : number){
        // angle is CENTER of swing
        // rescale(0, lifespan, start_angle, start_angle + velocity * lifespan, lifespan/2 ) = angle
        let start_angle = angle - velocity * lifespan/2; 
        this.swing = {"angle" : start_angle, "velocity" : velocity, "lifespan" : lifespan, "size" : size}
    }
    seeing_monster_see_player(firstone : boolean = false) : number[]{ // indices of monsters that see the player
        let seen = [];
        for(let [i, monster] of this.monsters.entries()){
            if(monster instanceof seeing_monster && dist(this.player, monster.position) < monster.vision_range && (dist(this.player, monster.position) == 0 || vector_angle(lincomb(1, this.player, -1, monster.position) as point, [Math.cos(monster.direction), Math.sin(monster.direction)]) <= monster.vision_arc)){
                seen.push(i);
                if(firstone){
                    return seen; 
                } 
            }
        }
        return seen; 
    }
    get_monsters(){
        return this.monsters;
    }
    attack_monster(monster : monster, type : "fireball" | "swing"){
        monster.active = false;
    }
    handle_repel(){
        // repel monsters
        for(let item of this.repel_spells){
            item.position = lincomb(1, item.position, 1, item.velocity) as point; 
            item.tick();
            for(let item2 of this.monsters.concat(this.monsters).concat(this.monsters).concat(this.monsters)){
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
            for(let item2 of this.get_monsters()){
                if(dist(item.position, item2.position) < item.width){
                    this.attack_monster(item2, "fireball")
                }
            }
        }
        this.fireball_spells = this.fireball_spells.filter(x => x.lifespan > 0);
    }
    handle_swing(){
        if(this.swing != undefined){
            for(let monster of this.get_monsters()){
                let v = lincomb(1, monster.position, -1, this.player); 
                let distance = len(v);
                if(distance == 0){
                    this.attack_monster(monster, "swing");
                } else if(distance <= this.swing.size) {
                    // compare angle 
                    let angle =angle_between(v,[Math.cos(this.swing.angle), Math.sin(this.swing.angle)]);
                    if(angle < 1.2 * this.swing.velocity){
                        this.attack_monster(monster, "swing");
                    } 
                }
            }
            this.swing.angle += this.swing.velocity;
            this.swing.lifespan--;
            console.log(this.swing.lifespan);
            if(this.swing.lifespan <= 0){
                this.swing = undefined;
            }
        }
    }
    handle_collect(){
        for(let [i, coin] of this.coin_points.entries()){
            if(dist(this.player, coin) < 60) {
                this.collected[i] = true; 
            }
        }
    }
    handle_lasers(){
        for(let monster of this.get_monsters()){
            if(monster.lasering && monster.lasering.type == "active"){
                let dist = pointClosestToSegment(this.player, monster.position, lincomb(1, monster.position, monster.lasering.range, [Math.cos(monster.lasering.direction), Math.sin(monster.lasering.direction)]))[2];
                if(dist < 7){
                    console.log("lasered");
                }
            }
        }
    }

    //for maze stuff
    is_tree(x : number, y : number){
        let tree = this.maze_points[x][y];
        for(let coll of this.coin_points){
            if(x == coll[0] && y == coll[1]){
                tree = false; 
            }
        }
        return tree
    }
    restart_maze(){
        this.coin_points = [];
        this.maze_chops = this.maze_chops_init;
        this.player = [0,0];
    }

    // looks for "deleted" in name
    clear_deleted_monsters(){
        for(let lst of [this.monsters, this.monsters, this.monsters, this.monsters]){
            for(let i=lst.length-1; i>= 0; i--){
                if(lst[i].active == false){
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
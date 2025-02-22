import _, { countBy, flatten, shuffle } from "lodash";
import { game_interface, point } from "../interfaces";
import { angle_between, bfs, dist, doLinesIntersect, dot, getIntersection, len, lerp, lincomb, move_lst, moveIntoRectangleWH, moveTo, normalize, pointClosestToSegment, pointInsidePolygon, pointInsideRectangleWH, pointToCoefficients, rescale, vector_angle } from "../lines";
import { rotate_command, scale_command } from "../rotation";
import { d_image } from "../canvasDrawing";
import { dag } from "../dag";
import { canvas_size, min_town_dist, player_speed } from "./constants";
import files from "./database.json";


type attack_type =  repel_spell | fireball_spell | "swing"


// attribs have "this" = the monster, and take values  (game : game, type :attack_type) 
// special ones are "see_player", "touch_player" and "hit"; 


export class fairy {   
    position : point
    name : string
    age : number = 0
    attrib : Record<string, any> = {};
    active : boolean = true;
    should_check : (g : game, type : attack_type | monster) => boolean; // hit by player or monster
    hit : (g : game, type : attack_type) => void; // hit by player attack
    touch_player : (g : game) => void; //touched player
    tick_fn : (g : game) => void
    monster_touch :(g : game, m : monster) => void;  // touched monster
    
    constructor(position : point,name : string, should_check :(g : game, type : attack_type | monster) => boolean , hit : (g : game) => void, touch_player : (g : game) => void,tick_fn : (g : game) => void,monster_touch :(g : game, m : monster) => void){
        this.position=position;
        this.name=name;
        this.hit = hit;
        this.touch_player = touch_player;
        this.tick_fn = tick_fn;
        this.should_check = should_check;
        this.monster_touch = monster_touch;
    }
    tick(g : game){
        this.age++;
        this.tick_fn(g);
    }
}
// default for all attacks 


export class monster { 
    position : point;
    name : string
    age : number = 0;
    active : boolean = true; 
    dont_count : boolean = false ; // if this monster is inactive , don't count it as a kill
    see_player : (g : game) => void;
    should_check : (g : game, type : attack_type ) => boolean; // hit by player attack
    hit : (g : game, type : attack_type) => void; // hit by player attack
    touch_player : (g : game, laser : boolean) => void; // monster touched player
    tick_fn : (g : game) => void

    lasering ?: {"type" : "threat" , time : number, direction : number, range : number, active_time : number} | {"type" : "active", time : number,direction : number, range : number}; 
    vision ?: {vision_range:number
        vision_arc:number
    direction : number}

    attrib : Record<string, any> = {}; 
    constructor(position : point, name : string = "",see_player : (g : game) => void, should_check :(g : game, type : attack_type) => boolean , hit : (g : game, type : attack_type) => void, touch_player : (g : game , laser: boolean) => void,tick_fn : (g : game) => void){
        this.position = position; 
        this.name = name;
        this.see_player = see_player;
        this.hit = hit;
        this.touch_player = touch_player;
        this.tick_fn = tick_fn;
        this.should_check = should_check;

    }
    tick(g : game){
        this.age++;
        this.tick_fn(g);
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
        this.position = lincomb(1,this.position,1,this.velocity) as point;
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
        this.position = lincomb(1,this.position,1,this.velocity) as point;
        this.lifespan--;
    }
}




type swing_type = {"angle" : number, "velocity" : number, size : number, "lifespan" : number, offset : point};
class game implements game_interface{
    //fundamentals 
    dims : point = [0,0]; // width, height
    mode :modes = "chase"; 
    time : number = 0;
    move_flag = true; // if the mode is one where the player moves around 
    monsters_killed : number = 0; 
    player_hits : number = 0;
    seed : string;
    // player movement
    player : point = [400,400];
    target : point = [400, 400];

    //monsters
    monsters : monster[] = [];
    fairies : fairy[] = [];

    swing : undefined | swing_type = undefined
    // common stuff
    trees : point[] = []; 
    seen_time : number = 0;
    seen_total : number = 0;
    repel_spells : repel_spell[] = []; 
    fireball_spells : fireball_spell[] = [];
    walls : [point, point][]  = []; 
    exit ?: point 
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
    item_tasks : Record<string, string>; 
    collected_dag : Set<string> = new Set();
    town_locations : Record<string, point>; 
    sort : string[];
    // tick stuff - returns if the player has won or lost
    tick_fn ?: (g : game) => "victory" | "defeat" | undefined; 

    last_swing : number = Number.NEGATIVE_INFINITY;
    last_repel : number = Number.NEGATIVE_INFINITY;
    last_fireball : number = Number.NEGATIVE_INFINITY;
    can_swing : boolean = false;
    can_repel : boolean = false;
    can_fireball : boolean = false;
    images : string[] = [];
    item_names : string[] = [];
    // objective info
    kill_target : number | undefined = undefined;
    time_target : number | undefined = undefined;

    constructor(seed : string, n_vertices : number){
        this.seed = seed;  
        this.graph = new dag(_.range(n_vertices).map(x => x.toString()), []);  
        for(let i=0; i<2*n_vertices || this.graph.get_exposed_vertices(new Set()).size >= 6; i++){
            try {
                this.graph.add_edge(Math.floor(Math.random() * n_vertices).toString(), Math.floor(Math.random() * n_vertices).toString());
                this.graph.add_edge(i.toString(), Math.floor(Math.random() * n_vertices).toString());

            }catch(e){

            }
        }
        let exposed_vertices = this.graph.get_exposed_vertices(new Set()); 
        while(true){
            let n_towns = Math.ceil(n_vertices/4);
            this.towns = {}; 
            for (let i=0 ;i<n_towns; i++){
                this.towns[i.toString()] = new Set(); 
            }
            for(let i=0; i<n_vertices; i++){
                let chosen_town = 0;
                if(exposed_vertices.has(i.toString())){
                    chosen_town = 0;
                } else {
                    chosen_town =  Math.floor(Math.random() * (n_towns-1)) + 1;
                }
                this.towns[chosen_town.toString()].add(i.toString());
                
            }
            if(_.every(Object.values(this.towns).map(x => x.size >= 2))){
                break;
            }
        }
        this.town_locations = {};
        for(let item of Object.keys(this.towns)){
            while(true){
                let next_point : point = [Math.random() * canvas_size[0], Math.random() * canvas_size[1]];
                next_point = lincomb(0.7, next_point, 0.1, canvas_size) as point;
                if(_.some(Object.values(this.town_locations).map(x => dist(x, next_point) < min_town_dist))){
                } else {
                    this.town_locations[item] = next_point;
                    break; 
                }
            }
        }
        this.sort =  this.graph.toposort()
        this.item_tasks = {};
        for(let [i, item] of this.sort.entries()){
            let ratio = i / this.sort.length;
            let choice = "fetch maze escape potions"
            if(ratio > 0.3){
              choice += " escort fairy"
            }
            if(ratio > 0.5){
              choice += " kill assassin";
            }
            let lst = choice.split(" ");
            //DEBUG:
            //lst = ["fastwin"]
            //this.can_swing  = true;
            //this.can_repel = true;
            //this.can_fireball  = true;
            //END DEBUG
            this.item_tasks[this.sort[i]] =lst[Math.floor(Math.random() * lst.length)]
        }
        // images
        let s = _.shuffle(Object.values(files[1]));
        this.item_names = s.map(x => x.name);
        this.images = s.map(x => x.image);
    } ; 
    clear(){
        this.time = 0; 
        this.monsters_killed = 0;
        this.player_hits = 0;
        this.monsters = []; 
        this.fairies = []; 
        this.swing = undefined;

        this.trees = [];
        this.seen_time = 0;
        this.seen_total = 0;
        this.repel_spells = [];
        this.fireball_spells = [];
        this.walls = [];
        this.exit = undefined;

        this.escort_points = [];
        this.escort_pos = [0,0];
        this.escort_speed = 0;
        this.escort_next_point = 0; 

        this.coin_points = [];
        this.collected = []; 

        this.maze_points = []; 
        this.potions = []
        this.rules = [];
        this.already_put = []; 
        
        this.tick_fn = undefined;

        this.kill_target  = undefined;
        this.time_target  = undefined;

        this.last_swing = Number.NEGATIVE_INFINITY;
        this.last_repel = Number.NEGATIVE_INFINITY;
        this.last_fireball = Number.NEGATIVE_INFINITY;

        // DO NOT CLEAR DAG 
    }
    setup_chase(w : number, h : number){
        this.clear()
        this.mode = "chase";
        this.move_flag = true;
        this.player = [w/2, h/2];
        this.target = [w/2, h/2];

        this.dims = [w,h]; 
    }
    // discrete move;
    setup_maze(w : number, h : number){
        this.clear()
        this.move_flag = false;
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
        this.move_flag = false;
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
        

        // generate rules to constrain potions
        while(this.rules.length < 18){
            let choice :  "first" | "before"  | "last"  = _.sample(["first", "before", "last",]); 
            // choose a potion to constrain 
            let index = 0;
            if(this.rules.length < this.potions.length){
                index = this.rules.length;
            } else {
                index = Math.floor(Math.random() * num_potions)
            }
            let constrained_potion = this.potions[index];
            if(constrained_potion == undefined){
                throw "constrained is undefined";
            }
            if(choice == "first"){
                this.rules.push({type:"first", x : constrained_potion, y : Math.min(num_potions, Math.ceil((index +0.1)* (1.2 + Math.random() * 0.3)))}); 
            }
            if(choice == "last" && index != 0){
                this.rules.push({type:"last", x : constrained_potion, y : Math.max(1, Math.floor((index-0.1) * (0.8 - Math.random() * 0.2)))}); 
            }
            if(choice == "before"){
                let index2 = -1
                while(index2 == -1 || index == index2){
                    index2 = Math.floor(Math.random() * num_potions);
                }
                if(index2 < index){
                    this.rules.push({type:"before", y : constrained_potion, x : this.potions[index2]});
                } else {
                    this.rules.push({type:"before", x : constrained_potion, y : this.potions[index2]}); 
                }
            }
        }
        this.rules = _.shuffle(this.rules)
        this.already_put = this.potions;
        if(!_.every(this.check_potions())){
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
        if(this.move_flag == false){
            this.player = lincomb(1, this.player, 1, input) as point;
            this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;
        }
    }

    tick(){
        this.time++;
        // consistency checks
        if(this.coin_points.length != this.collected.length){
            this.collected = [];
            for(let i=0; i < this.collected.length; i++){
                this.collected.push(false);
            }
        }
        // default actions, for any "moving" stuff
        if(this.move_flag){
            this.move_wall(this.player, this.target,player_speed) ; 
            this.player = moveIntoRectangleWH(this.player, [0,0], this.dims) as point;   
            this.get_monsters().forEach(x => {x.tick(this); x.position = moveIntoRectangleWH(x.position, [0,0], this.dims) as point});
            this.fairies.forEach(x => {x.tick(this); x.position = moveIntoRectangleWH(x.position, [0,0], this.dims) as point});
            this.handle_spells();
            this.handle_swing();
            this.handle_collect();
            this.handle_lasers();
            this.handle_seeing_monsters();
            this.handle_monster_touch_player();
            this.handle_escort();
            this.clear_deleted_monsters();
            this.handle_fairy_touch();
        }
        if(this.tick_fn){
            this.tick_fn(this);
        }
        return []; 
    }
    // all of these are WORLD (not canvas) coordinates , the game doesn't even know there is a canvas! 
    cast_repel_spell (x : number, y : number,  lifespan : number, width : number = 100, velocity : number = 10){
        this.last_repel = this.time;
        let v = normalize ([x,y], velocity) as point; 
        this.repel_spells.push(new repel_spell(this.player, v, width, lifespan));
    }

    cast_fireball_spell (x : number, y : number,  lifespan : number, width : number = 100, velocity : number = 10){
        this.last_fireball = this.time;
        let v = normalize ([x,y], velocity) as point; 
        this.fireball_spells.push(new fireball_spell(this.player, v, width, lifespan));
        
    }
    start_swing(size : number, angle : number, lifespan : number, velocity : number, offset : point){
        // angle is CENTER of swing
        // rescale(0, lifespan, start_angle, start_angle + velocity * lifespan, lifespan/2 ) = angle
        this.last_swing = this.time;
        let start_angle = angle - velocity * lifespan/2; 
        this.swing = {"angle" : start_angle, "velocity" : velocity, "lifespan" : lifespan, "size" : size, offset : offset}
    }
    seeing_monster_see_player(monster : monster) : boolean{ //returns if the monster sees the player
        if( monster.vision && dist(this.player, monster.position) < monster.vision.vision_range && (dist(this.player, monster.position) == 0 || vector_angle(lincomb(1, this.player, -1, monster.position) as point, [Math.cos(monster.vision.direction), Math.sin(monster.vision.direction)]) <= monster.vision.vision_arc)){
                return true; 
        }
        return false; 
    }
    get_monsters(){
        return this.monsters;
    }

    handle_spells(){//does not handle swing
        let lst = this.repel_spells.concat(this.fireball_spells);
        for(let spell of lst){
            spell.tick();
            for(let monster of this.monsters){
                if(monster.should_check(this, spell) && dist(spell.position, monster.position) < spell.width ){
                    monster.hit(this, spell);
                }
            }    
            for(let fairy of this.fairies){
                if(fairy.should_check(this, spell) && dist(spell.position, fairy.position) < spell.width ){
                    fairy.hit(this, spell);
                }
            }
        }
        this.repel_spells = this.repel_spells.filter(x => x.lifespan > 0);
        this.fireball_spells = this.fireball_spells.filter(x => x.lifespan > 0);
    }
    swing_gets_point(point : point){
        if(this.swing == undefined){
            return false;
        }
        let v = lincomb(1, point, -1, lincomb(1, this.player, 1, this.swing.offset)); 
        let distance = len(v);
        if(distance == 0){
            return true;
        } else if(distance <= this.swing.size) {
            // compare angle 
            let angle =angle_between(v,[Math.cos(this.swing.angle), Math.sin(this.swing.angle)]);
            if(angle < 1.2 * this.swing.velocity){
                return true
            } 
        }
        return false; 
    }
    handle_swing(){
        if(this.swing != undefined){
            for(let monster of (this.monsters as (monster|fairy)[]).concat(this.fairies)){
                if(monster.should_check(this, "swing") && this.swing_gets_point(monster.position)){
                    monster.hit(this, "swing");
                }
            }
            this.swing.angle += this.swing.velocity;
            this.swing.lifespan--;
            if(this.swing.lifespan <= 0){
                this.swing = undefined;
            }
        }
    }

    handle_seeing_monsters(){
        
        let seen = false; 
        for(let monster of this.monsters){
            if(monster.vision){
                if(this.seeing_monster_see_player(monster)){
                    seen = true;
                    monster.see_player(this);
                }
            }
        }           
        if(seen){
            this.seen_time ++;
            this.seen_total ++;
        } else {
            this.seen_time = 0;
        }
        return [];
    }
    handle_escort(){
        if(this.escort_points.length > 0 && dist(this.player, this.escort_pos) < 500){
            
        // move the escorted person , only if the player is nearby
            let next_point = this.escort_points[this.escort_next_point];
            this.escort_pos = moveTo(this.escort_pos, next_point, this.escort_speed) as point;
            if(dist(this.escort_pos, next_point) < 1){
                if(this.escort_next_point < this.escort_points.length-1){
                    this.escort_next_point++;
                }
            }
        }
        return [];
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
                    monster.touch_player(this ,true);
                    this.player_hits++;
                }
            }
        }
    }
    //fairy touch anything (monsters, player attacks, player itself)
    handle_fairy_touch(){
        for(let fairy of this.fairies){
            //check monsters
            for(let monster of this.monsters){
                if(fairy.should_check(this, monster)){
                    if(dist(monster.position, fairy.position) < 20){
                        fairy.monster_touch(this,monster);
                    }
                }
            }
            //check player attacks
            let check_lst : attack_type[]=  this.repel_spells.concat(this.fireball_spells);
            if(this.swing_gets_point(fairy.position)){
                check_lst.push("swing");
            }
            for(let item of check_lst){
                if(fairy.should_check(this, item)){
                    if(item == "swing" || dist(item.position, fairy.position) < 20){
                        fairy.hit(this,item);
                    }
                }
            }
            //check player
            if(dist(fairy.position, this.player) < 20){
                fairy.touch_player(this);
            }
        }
    }

    handle_monster_touch_player(){
        for(let monster of this.monsters){
            if(dist(monster.position, this.player) < 20){
                monster.touch_player(this,false);
                this.player_hits++;
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
    move_maze(next_v : point){
        let g = this;
        let next_pos = lincomb(1, g.player, 1, next_v) as point;
        if(!pointInsideRectangleWH(next_pos, -0.01,-0.01,g.dims)){
            return "bounds";
        }
        let tree = g.is_tree(next_pos[0],next_pos[1]);
        if(tree) {
            if(g.maze_chops == 0){
                return "chops";
            } 
            g.coin_points.push([...next_pos] as point);
            g.maze_chops--;
            g.player = next_pos;
        } else {
            g.player = next_pos;
        }
        return "good";
    }
    // looks for "deleted" in name
    clear_deleted_monsters(){
        for(let lst of [this.monsters, this.monsters, this.monsters, this.monsters]){
            for(let i=lst.length-1; i>= 0; i--){
                if(lst[i].active == false){
                    if(lst[i].dont_count == false){
                        this.monsters_killed ++; 
                    }
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
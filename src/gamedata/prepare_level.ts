import _ from "lodash";
import { dist, doLinesIntersect, flatten, lincomb, pointClosestToSegment, rescale, unit_vector } from "../lines";
import game, { monster } from "./game";
import { player_max_hp, player_speed } from "./constants";
import { base_fairy, laser_monster, lunge_monster, pursue, shoot_bullets, wanderer } from "./monster_patterns";

export function prepare_level(g : game, choice : string, sort_index : number){
    // trees
    let size = rescale(0, g.sort.length, 5000, 20000, sort_index);
    let ratio = sort_index / g.sort.length; 


    if(choice == "fetch"){
        g.setup_chase(size,size);
        g.player = [size/2, size-100];
        let n_coins = Math.ceil(1 + ratio*19); 
        for(let i=0; i < n_coins; i++){
            g.coin_points.push([Math.random() * size, Math.random() * size/3]);
            g.collected.push(false);
        }
        g.tick_fn = function(g){
            if(_.every(g.collected)){
                return "victory";
            }
            if(g.player_hits > player_max_hp){
                return "defeat";
            }
        }
    }
    if(choice == "escape"){
        g.setup_chase(size, size); 
        g.player = [size/2, 100];
        g.exit = [Math.random() * size, (Math.random()*0.1 + 0.88) * size ];
        g.tick_fn = function(g){
            if(g.exit && dist(g.player, g.exit) < 20){
                return "victory";
            }
            if(g.seen_time > player_max_hp){
                return "defeat";
            }
        }
    }
    if(choice == "escort"){
        g.setup_chase(size, size);
        g.player = [size/2, 100];
        g.escort_pos = [size/2, 100]
        g.escort_points = [[size/2, 100]];
        g.escort_speed = player_speed-1;
        let angle = -Math.PI/2
        for(let i=0; i < 20; i++){
            angle += 2 * Math.PI / 20; 
            g.escort_points.push(lincomb(1, [size/2, size/2] ,( Math.random() * 0.2 + 0.75) * size/2, unit_vector(angle)) as point);
        }
        g.tick_fn = function(g){
            if(dist(g.escort_pos , g.escort_points[g.escort_points.length-1]) < 20){
                return "victory";
            }
            for(let monster of g.monsters){
                if(dist(monster.position, g.escort_pos) < 10){
                    g.player_hits ++;
                }
            }
            if(g.player_hits > player_max_hp){
                return "defeat";
            }
        }
    }
    if(choice == "kill"){
        g.setup_chase(size, size);
        g.player = [size/2, 100];
        g.kill_target = Math.floor(100 + 100*ratio);
        g.tick_fn = function(g){
            if(g.kill_target == undefined || g.monsters_killed >= g.kill_target){
                return "victory";
            }
            if(g.player_hits > player_max_hp){
                return "defeat";
            }
        }
    }
    if(choice == "fairy"){ // fairy has small map
        g.setup_chase(1200, 1200);
        g.player = [600, 600]
        base_fairy(g, 600, 600);
        g.time_target = Math.floor(3000 + 2000*ratio);
        g.tick_fn = function(g){
            if(g.time_target == undefined || g.time >= g.time_target){
                return "victory";
            }
            if(g.player_hits > player_max_hp){
                return "defeat";
            }
        }
    }

    if(choice == "assassin"){
        g.setup_chase(size, size);
        g.player = [size/2, 100];
        let m = wanderer(g, 1, size-100, 7);
        m.name = "target";

        g.tick_fn = function(g){
            if(g.monsters[0].name != "target"){
                return "victory";
            }
            if(g.player_hits > player_max_hp){
                return "defeat";
            }
        }
    }


    if(choice == "maze"){
        g.setup_maze(Math.min(12 + Math.floor(ratio*10), 18), Math.min(12 + Math.floor(ratio*10), 15));
        g.tick_fn = function(g){
            if(g.player[0] == g.dims[0] - 1 && g.player[1] == g.dims[1]-1){
                return "victory";
            }
        }
    }

    if(choice == "potions"){
        g.setup_potions(12 + Math.floor(ratio * 10));
        g.tick_fn = function(g){
            if(_.every(g.check_potions())){
                return "victory";
            }
        }
    }
    // boilerplate 
    if( choice != "maze" && choice != "potions"){
        let old_g_fn = g.tick_fn;
        g.tick_fn = function(g : game){
            // monsters
            let monster_limit = g.dims[0] * g.dims[1] / (600*600) * 3; 
            if(choice == "kill"){
                monster_limit *=5;
            }
            while(g.monsters.filter(x => x.dont_count == false).length < monster_limit){
                if(choice == "escape" || choice == "assassin"){
                    let m = wanderer(g, Math.random() * g.dims[0], Math.random() * g.dims[1] , 2 + ratio);
                    m.vision = {vision_range: 200 + 100 * ratio,
                        vision_arc: 0.3 + 0.15 * ratio,
                        direction: Math.random() * 2 * Math.PI}
                } else if(choice != "escape"){ // assassin has both seeing monsters and non-seeing monsters;
                    let m : monster | undefined = undefined;
                    if(Math.random() < 0.5){
                        m = wanderer(g, Math.random() * g.dims[0], Math.random() * g.dims[1] , 2 + ratio)
                        m.name = "wander"
                    } else {
                        m = pursue(g, Math.random() * g.dims[0], Math.random() * g.dims[1] , 3 + ratio)
                        m.name = "pursue";
                        if((choice == "escort" || choice == "fairy") && Math.random() < 0.5){
                            m.attrib["escort flag"] = true;
                        }
                    }
                    if(Math.random() < 0.2){
                        lunge_monster(m);
                        m.attrib["lunge duration"] = 15 + ratio * 8;
                        m.attrib["lunge speed"] = 8 + 2*ratio;
                        m.name = "lunge"
                    } else if (Math.random() < 0.2 + ratio){
                        if(Math.random() < 0.5){
                            laser_monster(m);
                            m.name = "laser";
                        } else {
                            shoot_bullets(m);
                            m.name = "shoot";
                        }
                    } 
                    if(choice == "kill" && m.name != "assassin") {
                        m.should_check = () => false; 
                    }
                }
            }
            while(g.trees.length < monster_limit){
                g.trees.push([ Math.random() * g.dims[0], Math.random() * g.dims[1]]);
            }
            if(old_g_fn != undefined){
                return old_g_fn(g); 
            } 
        }
        // walls
        function is_wall_valid(wall : [point, point], existing_walls : [point, point][]){
            for(let wall2 of existing_walls){
                if(doLinesIntersect(flatten(wall), flatten(wall2))){
                    return false;
                }
                let d = _.min([pointClosestToSegment(wall[0], flatten(wall2))[2], pointClosestToSegment(wall[1], flatten(wall2))[2]] );
                if(d != undefined && d < 50){
                    return false; 
                }
            }
            return true; 
        }
        let num_walls = Math.floor(10 + 20*ratio);
        if(choice == "fairy"){
            num_walls = 0;
        }
        for(let i = 0; i < num_walls; i++){
            let angle = Math.random() * 2 * Math.PI
            let length = 1000 + ratio * 2000;
            let start :point = [Math.random() * g.dims[0], Math.random() * g.dims[1]]
            let wall : [point, point]= [start, lincomb(1, start, length, [Math.cos(angle), Math.sin(angle)]) as point]
            if(is_wall_valid(wall, g.walls)){
                let good = true;
                for(let i=0; i < g.escort_points.length-1; i++){
                    if(doLinesIntersect(flatten(wall), g.escort_points[i], g.escort_points[i+1])){
                        good = false;
                    }
                }
                if(good){
                    g.walls.push(wall);    
                }
            }
        }
        //trees
    }
}
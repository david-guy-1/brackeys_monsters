// move player to target location  on screen, update last pos 

import _ from "lodash";
import { add_com, d_circle, d_image, d_line, d_rect, d_rect2 } from "../canvasDrawing";
import { dist, flatten, len, lincomb, move_lst , moveIntoRectangleBR, moveIntoRectangleWH, moveTo, num_diffs, rescale, taxicab_dist } from "../lines";
import { displace_command, rotate_command, scale_command } from "../rotation";
import { canvas_size, mouse_radius, player_box, player_screen_speed } from "./constants";
import game, { monster }  from "./game";


export function get_draw_commands(m : monster): draw_command[]{
    //base : wander pursue target
    //extra : lunge laser shoot 
    let left_facing = true;
    if(m.attrib["angle"] != undefined){
        let angle = m.attrib["angle"]%(2*Math.PI)
        if(angle < 0){
            angle += 2 * Math.PI;
        }
        if(angle < Math.PI/2 || angle > 3*Math.PI/2){
            left_facing = false; 
        }
    }
    let lst = []
    if(m.name.indexOf("wander")!=-1 || m.name.indexOf("target")!=-1){
        lst.push(d_image(`monsters/wander${left_facing?"":"2"}.png`, lincomb(1, m.position, -1, [20,20]) as point));
    }
    if(m.name.indexOf("pursue")!=-1){
        lst.push(d_image(`monsters/pursuit${left_facing?"":"2"}.png`, lincomb(1, m.position, -1, [20,15]) as point));
    }
    if(m.name.indexOf("bullet") != -1){
        lst.push(add_com(d_circle(m.position, 3), {"color":"red", "fill":true}));
    }

    if(lst.length == 0){
        throw "no image found" + m.name;
    }

    //extras
    if(m.name.indexOf("lunge") != -1 && m.attrib["lunging"]){
        lst.push(d_image(`monsters/lunge.png`, lincomb(1, m.position, -1, [15,15]) as point));
    }
    if(m.name.indexOf("laser") != -1){
        lst.push(d_image(`monsters/laser${left_facing? "" : "2"}.png`, lincomb( 1, m.position, 1, [left_facing ? -54 : 20, -15])));
    }
    if(m.name.indexOf("shoot") != -1){
        lst.push(d_image(`monsters/gun${left_facing? "" : "2"}.png`, lincomb( 1, m.position, 1, [left_facing ? -54 : 20, -15])));
    }

    return lst;
//    return [d_image("images/monster.png", m.position)];
}

let canonical_swing : drawBezierShape_command = {"type":"drawBezierShape","x":0,"y":0,"curves":[[11.895910780669144,7.434944237918216,30.111524163568774,12.267657992565054,47.95539033457249,11.152416356877314],[59.10780669144981,10.780669144981406,74.72118959107806,7.43494423791821,84.38661710037174,5.576208178438658],[94.79553903345723,2.230483271375457,101.11524163568772,0.7434944237918152,105.94795539033457,-1.1152416356877415],[100.00000000000001,4.460966542750932,93.68029739776951,8.550185873605935,83.27137546468403,12.267657992565043],[74.34944237918215,14.86988847583642,61.71003717472119,16.728624535315976,48.3271375464684,16.72862453531598],[31.970260223048324,15.985130111524164,22.67657992565056,15.613382899628252,8.550185873605948,11.152416356877323],[1.8587360594795534,7.063197026022304,-3.7174721189591073,3.717472118959108,-1.8587360594795537,2.2762951657013997e-16]],"color":{"type":"fill_radial","x0":49.44237918215611,"y0":-98.51301115241635,"r0":0.37174721189591076,"x1":49.44237918215611,"y1":-98.51301115241635,"r1":117.84386617100371,"colorstops":[[0.93,"#cccccc"],[1,"#333333"]]}};



export function move_player_to_point(g : game, globalStore : globalStore_type, speed : number = player_screen_speed){
    // compute difference with last game location to know where to draw player
    let diff = lincomb(1, g.player, -1, globalStore.player_last_pos);
    globalStore.player_pos = lincomb(1, globalStore.player_pos, 1, diff) as point;
    globalStore.player_pos = moveIntoRectangleBR(globalStore.player_pos, player_box)  as point;

    globalStore.player_last_pos = [...g.player];

    // move player based on mouse 
    // note that this must be done AFTER player_pos is updated, otherwise it's inconsistent : game has moved but display has not 
    if(dist(globalStore.mouse_pos, globalStore.player_pos) > mouse_radius ){
        g.target= lincomb(1, g.player,1,  lincomb(1,  globalStore.mouse_pos, -1, globalStore.player_pos)) as point; 
    }


}

export function draw_monsters(g : game){
    // draw all monsters at the position in the game, move them later
    let output : draw_command[] = []; 
    for(let monster of g.monsters){
        if(taxicab_dist(monster.position, g.player) > 1000){
            continue;
        }
        output = output.concat(get_draw_commands(monster));
        if(monster.vision ){
            // draw direction facing
            if(typeof monster.attrib["angle"] == "number"){
                output.push(d_line(monster.position, lincomb(1, monster.position, 100, [Math.cos(monster.attrib["angle"]),Math.sin(monster.attrib["angle"])])))
            }
            //draw the arc 
        
            let points : point[] = [monster.position]; 
            for(let i=0; i<20; i++){
                let angle = rescale(0, 20, monster.vision.direction-monster.vision.vision_arc, monster.vision.direction+monster.vision.vision_arc, i); 
                points.push( lincomb(1, monster.position, monster.vision.vision_range, [Math.cos(angle), Math.sin(angle)]) as point);
            }
            points.push(monster.position); 
            output.push({type:"drawPolygon", "points_x" : points.map(x => x[0]), "points_y" : points.map(x => x[1]), color : "red", fill: true, transparency : 0.1})
        }
    }
    return output;
}
export function draw_repel_spells(g : game){
    let output : draw_command[] = [];
    for(let spell of g.repel_spells){
        output.push(displace_command(spell.draw, lincomb(1, [0,0], 1, spell.position) as point)); 
    }    
    return output;
}

export function draw_fireball_spells(g : game){
    let output : draw_command[] = [];
    for(let spell of g.fireball_spells){
        output.push(displace_command(spell.draw, lincomb(1, [0,0], 1, spell.position) as point)); 
    }    
    return output;
}

export function draw_swing(g : game, globalStore : globalStore_type){
    if(g.swing != undefined){
        let d = lincomb(1, globalStore.mouse_pos, -1, globalStore.player_pos); 
        return [displace_command(rotate_command(scale_command(canonical_swing,[0,0], 110/g.swing.size,110/g.swing.size) , [0,0], g.swing.angle), lincomb(1, g.player,1, [d[0] < 0 ? -22 : 22, -23] ) as point)];
    } else {
        return []
    }
}
export function draw_trees(g : game){
    let output : draw_command[] = [];
    for(let tree of g.trees) {
        output.push(d_image("images/tree.png", tree));
    }
    return output; 
}
export function draw_coins(g : game){
    let output : draw_command[] = [];
    for(let [i, coin] of g.coin_points.entries()) {
        if(!g.collected[i]){
            output.push(d_image("images/coin.png", coin));
        }
    }
    return output;
}

export function draw_walls(g : game, drawn_walls:draw_command[][]){ 
    let output : draw_command[] = []
    for(let [i, wall] of g.walls.entries()){
        if(drawn_walls[i] != undefined){
            output = output.concat(drawn_walls[i]);
        }else {
            let p =[... wall[0]]
            let commands : draw_command[] = [];
            while(dist(p, wall[1]) >3){
                let r = Math.random() * 3 + 3;
                let color = `hsl(${Math.random() * 360}, 100%, 30%)`
                commands.push(add_com(d_circle(p, r),{fill:true, color:color}));
                p = moveTo(p, wall[1], r);
            }
            drawn_walls.push(commands);
            output = output.concat(commands);
        }
    }
    return output;
}

export function draw_fairies(g : game){ 
    let output : draw_command[] = [];
    for(let fairy of g.fairies){
        if(fairy.active){
            output.push(d_image("images/fairy.png", lincomb(1, fairy.position, -1, [20,20])));
        }
    }
    return output;
}

export function draw_lasers(g : game){
    let output : draw_command[] = [];
    for(let monster of g.get_monsters()){
        if(monster.lasering){
            if(monster.lasering.type == "threat"){
                output.push(add_com(d_line(monster.position, lincomb(1, monster.position, monster.lasering.range, [Math.cos(monster.lasering.direction), Math.sin(monster.lasering.direction)])), {"color":"red", "width":3}));
            }
            if(monster.lasering.type == "active"){
                for(let [x, y] of [[15, "red"], [10, "yellow"], [5, "white"]]){
                    //console.log([x,y])
                    output.push(add_com(d_line(monster.position, lincomb(1, monster.position, monster.lasering.range, [Math.cos(monster.lasering.direction), Math.sin(monster.lasering.direction)])), {"color":y, "width":x}));
                }
            }
        }
    }
    return output;
}
    // arrow
export function draw_arrow(g : game){
    let direction : number | undefined = undefined;
    // escort
    if(g.escort_points.length != 0){
        let d = lincomb(1, g.escort_pos, -1, g.player);
        direction = Math.atan2(d[1], d[0]);
    }
    // exit
    if(g.exit){
        let d = lincomb(1, g.exit, -1, g.player);
        direction = Math.atan2(d[1], d[0]);
    }
    // coins
    if(g.coin_points.length != 0){
        let valid = _.range(g.coin_points.length).filter(x => g.collected[x] == false)
        if(valid.length > 0){
            let min_index = _.minBy(valid, x => dist(g.player, g.coin_points[x]))
            if(min_index != undefined){
                let d = lincomb(1, g.coin_points[min_index], -1, g.player); 
                direction = Math.atan2(d[1], d[0]);
            }
        }
    }
    //target
    for(let m of g.monsters){
        if(m.name.indexOf("target") != -1){
            let d = lincomb(1, m.position, -1, g.player);
            direction = Math.atan2(d[1], d[0]);
            break;
        }
    }
    if(direction != undefined){
        let command : draw_command= {type:"drawPolygon", color:"black", fill:true, "points_x" : [0,0,37], points_y : [283-289,295-289,0]}
        command = displace_command(command, [200, 0]);
        command = rotate_command(command, [0,0], direction)
        command = displace_command(command, [canvas_size[0]/2, canvas_size[1]/2])
        return command;
    }
}
export function draw_all(g : game, store : globalStore_type){
    let output : draw_command[] = [];
    // escort
    if(g.escort_points.length != 0){
        output.push(d_image("images/escorted.png", g.escort_pos))
    }
    if(g.exit){
        output.push(d_image("images/portal.png", lincomb(1, g.exit, -1, [20,20])));
    }

    

    output = output.concat(draw_trees(g)).concat(draw_monsters(g)).concat(draw_repel_spells(g)).concat(draw_fireball_spells(g)).concat(draw_swing(g, store)).concat(draw_coins(g)).concat(draw_walls(g,store.walls)).concat(draw_lasers(g)).concat(draw_fairies(g));
    return output;
}
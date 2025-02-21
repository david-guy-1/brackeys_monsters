// move player to target location  on screen, update last pos 

import { add_com, d_image, d_line, d_rect, d_rect2 } from "../canvasDrawing";
import { dist, flatten, len, lincomb, move_lst , moveIntoRectangleBR, moveIntoRectangleWH, moveTo, num_diffs, rescale } from "../lines";
import { displace_command, rotate_command, scale_command } from "../rotation";
import { mouse_radius, player_box, player_screen_speed } from "./constants";
import game , {get_draw_commands} from "./game";

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
        output = output.concat(get_draw_commands(monster));
        if(monster.vision ){
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

export function draw_swing(g : game){
    if(g.swing != undefined){
        return [displace_command(rotate_command(scale_command(canonical_swing,[0,0], 110/g.swing.size,110/g.swing.size) , [0,0], g.swing.angle), g.player)]
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

export function draw_walls(g : game){ 
    let output : draw_command[] = [];
    for(let wall of g.walls){
        console.log(wall);
        output.push(add_com(d_line(flatten(wall)), {width:5, color:"red"}))
    }
    return output;
}

export function draw_fairies(g : game){ 
    let output : draw_command[] = [];
    for(let fairy of g.fairies){
        if(fairy.active){
            output.push(d_image("images/fairy.png", fairy.position));
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
export function draw_all(g : game){
    let output : draw_command[] = [];
    output = output.concat(draw_trees(g)).concat(draw_monsters(g)).concat(draw_repel_spells(g)).concat(draw_fireball_spells(g)).concat(draw_swing(g)).concat(draw_coins(g)).concat(draw_walls(g)).concat(draw_lasers(g));
    return output;
}
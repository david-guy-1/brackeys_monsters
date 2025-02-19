// move player to target location  on screen, update last pos 

import { add_com, d_image, d_line } from "../canvasDrawing";
import { dist, flatten, lincomb, move_lst , moveIntoRectangleBR, moveIntoRectangleWH, moveTo, num_diffs, rescale } from "../lines";
import { displace_command } from "../rotation";
import { mouse_radius, player_box, player_screen_speed } from "./constants";
import game from "./game";

export function move_player_to_point(g : game, globalStore : globalStore_type, speed : number = player_screen_speed){
    let diff = lincomb(1, g.player, -1, globalStore.player_last_pos);
    globalStore.player_pos = lincomb(1, globalStore.player_pos, 1, diff) as point;
    globalStore.player_pos = moveIntoRectangleBR(globalStore.player_pos, player_box)  as point;

    globalStore.player_last_pos = [...g.player];
}

export function draw_monsters(g : game){
    // draw all monsters at the position in the game, move them later
    let output : draw_command[] = []; 
    for(let monster of g.monsters){
        output.push(d_image("images/monster.png", monster.position))
    }
    for(let monster of g.seeing_monsters){
        output.push(d_image("images/seeing_monster.png", monster.position))
        //draw the arc 
        let points : point[] = [monster.position]; 
        for(let i=0; i<20; i++){
            let angle = rescale(0, 20, monster.direction-monster.vision_arc, monster.direction+monster.vision_arc, i); 
            points.push( lincomb(1, monster.position, monster.vision_range, [Math.cos(angle), Math.sin(angle)]) as point);
        }
        points.push(monster.position); 
        output.push({type:"drawPolygon", "points_x" : points.map(x => x[0]), "points_y" : points.map(x => x[1]), color : "red", fill: true, transparency : 0.1})
        
    }
    for(let monster of g.roaming_monsters){
        output.push(d_image("images/roaming_monster.png", monster.position))
    }
    for(let monster of g.targeted_monsters){
        output.push(d_image("images/targeted_monster.png", monster.position))
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
export function draw_all(g : game){
    let output : draw_command[] = [];
    output = output.concat(draw_trees(g)).concat(draw_monsters(g)).concat(draw_repel_spells(g)).concat(draw_fireball_spells(g)).concat(draw_coins(g)).concat(draw_walls(g));
    return output;
}
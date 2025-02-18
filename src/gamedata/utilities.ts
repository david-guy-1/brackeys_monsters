// move player to target location  on screen, update last pos 

import { d_image } from "../canvasDrawing";
import { dist, lincomb, move_lst , moveTo, num_diffs, rescale } from "../lines";
import { displace_command } from "../rotation";
import { mouse_radius, player_screen_speed } from "./constants";
import game from "./game";

export function move_player_to_point(globalStore : globalStore_type, speed : number = player_screen_speed){
    if(num_diffs(globalStore.target_pos, globalStore.player_pos) > 0){    
        move_lst(globalStore.player_last_pos, globalStore.player_pos);
    }
    if(dist(globalStore.player_pos, globalStore.target_pos) > mouse_radius){
        globalStore.player_pos = moveTo(globalStore.player_pos, globalStore.target_pos, speed) as point; 
    }
}

export function draw_monsters(g : game){
    // draw all monsters at the position in the game, move them later
    let output : draw_command[] = []; 
    for(let monster of g.monsters){
        output.push(d_image("images/monster.png", monster))
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
    return output;
}
export function draw_repel_spells(g : game){
    let output : draw_command[] = [];
    for(let spell of g.repel_spells){
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

import { game_interface } from "./interfaces";
import { clear, draw } from "./process_draws";

export interface animation<T extends game_interface>{
  update : (g : T, globalStore : globalStore_type) => boolean; // true = remove 
  draw : (g : T, globalStore : globalStore_type) => draw_command[]; 
  canvas : string
}


// mutates 
export function update_all<T extends game_interface>(animations : animation<T>[],g : T, globalStore : globalStore_type) : void{
    for(var i = animations.length-1; i>=0; i--){
        var result = animations[i].update(g,globalStore);
        if(result){
            animations.splice(i, 1);
        } 
    }
}
// mutates 

/*
export function add_drawings(commands : draw_command[], animations:animation[], ...args : any) : void{
    for(var animation of animations){
        var new_commands=animation.draw(args);
        commands.push(...new_commands);
    }

}

*/

export function update_and_draw<T extends game_interface>(anim_lst : animation<T>[], g : T, globalStore : globalStore_type,refs : Record<string, React.RefObject<HTMLCanvasElement> >){
    update_all(anim_lst,g,globalStore); 
    for(let anim of anim_lst){
        let commands = anim.draw(g, globalStore);
        if(refs[anim.canvas]){
            draw(commands, refs[anim.canvas]);
        } else {
            console.log("WARNING: no canvas " + anim.canvas); // remove this if necessary
        }
    }
}
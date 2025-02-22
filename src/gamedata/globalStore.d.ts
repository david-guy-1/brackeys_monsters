type point = [number, number];
type globalStore_type = {
    player_pos : point;
    player_last_pos : point;
    mouse_pos : point;
    selected_potion ?: number ;
    potion_anim_state ?: {color : string, place : point} ;
    victory_conditions ?: victory_condition[];
    maze_msg ?: string
    flag_msg ?: string
    walls:draw_command[][]
}

// display modes (in App)
type exp_modes = ["game", string,string] | "menu" | "map" | "test" | ["town", string] | ["prepare", string] | ["win" , string, string] | ["lose", string, string]; 

/*
town : which town is selected

prepare : which item is selected

game/win/lose : the item and mode
*/


// game modes
type modes =  "chase" | "maze" | "potions";

type attack_type =  repel_spell | fireball_spell | "swing"


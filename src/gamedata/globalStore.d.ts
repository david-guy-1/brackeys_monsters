type point = [number, number];
type globalStore_type = {
    player_pos : point;
    player_last_pos : point;
    mouse_pos : point;
    selected_potion ?: number ;
    potion_anim_state ?: {color : string, place : point} ;
    victory_conditions ?: victory_condition[];
}

// display modes (in App)
type exp_modes = "game" | "menu" | "map" | "test" | ["town", string] | ["prepare" , any]; // decide what to prepare

// game modes
type modes =  "chase" | "maze" | "potions";

type attack_type =  repel_spell | fireball_spell | "swing"


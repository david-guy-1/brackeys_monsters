type point = [number, number];
type globalStore_type = {
    player_pos : point;
    player_last_pos : point;
    mouse_pos : point;
    selected_potion ?: number ;
    potion_anim_state ?: {color : string, place : point} ;
}


type exp_modes = modes | "menu" | "map";
type modes =  "chase" | "move" | "stealth" | "repel" | "escort" | "collect" | "maze" | "potions";

type attack_type =  repel_spell | fireball_spell | "swing"
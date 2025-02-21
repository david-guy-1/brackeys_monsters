type point = [number, number];
type globalStore_type = {
    player_pos : point;
    player_last_pos : point;
    mouse_pos : point;
    selected_potion ?: number ;
    potion_anim_state ?: {color : string, place : point} ;
    victory_conditions ?: victory_condition[];
}


type exp_modes = modes | "menu" | "map" | "test";
type modes =  "chase" | "maze" | "potions";

type attack_type =  repel_spell | fireball_spell | "swing"

// ALL must be met!
type victory_condition = ["kill monsters", number] | ["survive" , number] | ["collect coins" , number] | "escort"| "escape"  // add more here

type defeat_condition = ["fairy killed" , number] | ["seen" , number] | ["time" | number] | ['hits' | number]
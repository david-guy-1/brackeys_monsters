import { rect } from "../interfaces";

export let canvas_size : point = [600, 600]
export let player_speed : number = 8; // in-game player speed
export let player_screen_speed : number = 2; // player speed on the screen
export let player_box : rect = [200, 200, 400, 400]; // tl , br 
export let mouse_radius : number = 10 ; // don't move if mouse is within this amount of player

export let potion_start : point = [400, 50]
export let potion_size : number = 40; 
export let potions_per_row : number =5;
export let cauldron_pos : point =[10, 450];
export let min_town_dist = 70;

export let player_max_hp = 100;
import { JSX, useState } from 'react'
import game, {  repel_spell } from './game';

import { data_obj as chase_obj, fireball_attempt, repel_attempt, swing_attempt  } from './chase_gameData';
import { chop_tree, data_obj as maze_obj } from './maze_gameData';
import { data_obj as potions_obj } from './potions_gameData';
import { events } from '../EventManager';
import GameDisplay, { clone_gamedata } from '../GameDisplay';
import { between, cell_index, dist, lincomb, moveIntoRectangleBR, normalize } from '../lines';
import { canvas_size, cauldron_pos, mouse_radius, player_box, potion_size, potion_start, potions_per_row } from './constants';
import  Test_canvas  from '../test_canvas';
import { gamedata } from '../interfaces';
import MainMap from './MainMap';
import { loadImage } from '../canvasDrawing';
import Town from './Town';
import {choice as randchoice} from "../random"
import { laser_monster, pursue, shoot_bullets, wanderer } from './monster_patterns';
import { prepare_level } from './prepare_level';
import MuteButton from '../MuteButton';

// mousemove
function move_canvas(e : MouseEvent, g:game, store : globalStore_type){
  let target = (e.target as HTMLElement).getAttribute("data-key")
  if(target == null){
    target = "";
  }

  if(target.indexOf("main_canvas") != -1){ // topmost canvas element that is valid
      store.mouse_pos = [e.offsetX, e.offsetY];// set mouse position 
  }
}
function click_fn(e : MouseEvent, g : game, store : globalStore_type ){
  if(g.mode == "potions" && g.time > 5){
    // clicked on a potion
    let start_coord = lincomb(1, potion_start, -0.5, [potion_size,potion_size]) as point;
    let index = cell_index(start_coord, potion_size, potion_size, potions_per_row, e.offsetX, e.offsetY);
    if(index != undefined){
      let potion = g.potions[index[2]];
      if(potion != undefined && g.already_put.indexOf(potion) == -1){
        store.potion_anim_state = {color : g.potions[index[2]], "place" : [cauldron_pos[0]+150, 100]}
      }
    }
  }
}

function keydown(e : KeyboardEvent, g : game, store : globalStore_type ){
  if(g.mode == "maze"){
    if(e.key.toLowerCase() == "w"){
      chop_tree(g, [0, -1], store);
    }
    if(e.key.toLowerCase() == "a"){
      chop_tree(g, [-1,0], store);
    }
    if(e.key.toLowerCase() == "s"){
      chop_tree(g, [0, 1], store);
    }
    if(e.key.toLowerCase() == "d"){
      chop_tree(g, [1,0], store);
    }
  } else if(g.mode != "potions"){
    if(e.key.toLowerCase() == "q"){
      repel_attempt(g, store);
    }
    if(e.key.toLowerCase() == "w"){
      fireball_attempt(g, store);
    }
    
    if(e.key.toLowerCase() == "e"){
      swing_attempt(g, store);
    }  
  }
}

  // default store, override it if necessary 


function App() {
  const [g, setG] = useState<game | undefined>(undefined);
  const [mode, setMode] = useState<exp_modes >("menu");
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setGameData] = useState<gamedata>(clone_gamedata(chase_obj)); 
  function transition(s : exp_modes){
    setTransitioning(true);
    setTimeout(() => {setMode(s); setTransitioning(false)}, 0);
  }

  if(transitioning){
    return <>asdsasd</>
  }

  let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, player_last_pos : [0,0] , mouse_pos : [0,0], walls:[], display_contents : [], repel_cast:false,fireball_cast:false,swing_cast:false,end_sound_playing:false, maze_chopped : false, last_touch : Number.NEGATIVE_INFINITY}; 
  
  events["mousemove a"] = [move_canvas, null]
  events["click a"] = [click_fn, null]
  events["keydown a"] = [keydown, null];
  if(transitioning){
    return <> asdaakjd</>
  }
  if(mode == "menu"){
      let image_files =['mute.png', 'mute2.png', 'base_items/chests/chest_blue.png', 'base_items/chests/chest_green.png', 'base_items/chests/chest_purple.png', 'base_items/chests/chest_red.png', 'base_items/chests/chest_silver.png', 'base_items/chests/chest_yellow.png', 'base_items/items/amulet_black.png', 'base_items/items/amulet_blue.png', 'base_items/items/amulet_green.png', 'base_items/items/amulet_red.png', 'base_items/items/amulet_yellow.png', 'base_items/items/book_black_apple.png', 'base_items/items/book_black_lemon.png', 'base_items/items/book_black_sparkle.png', 'base_items/items/book_black_tree.png', 'base_items/items/book_black_volcano.png', 'base_items/items/book_blue_apple.png', 'base_items/items/book_blue_lemon.png', 'base_items/items/book_blue_sparkle.png', 'base_items/items/book_blue_tree.png', 'base_items/items/book_blue_volcano.png', 'base_items/items/book_green_apple.png', 'base_items/items/book_green_lemon.png', 'base_items/items/book_green_sparkle.png', 'base_items/items/book_green_volcano.png', 'base_items/items/book_purple_apple.png', 'base_items/items/book_purple_lemon.png', 'base_items/items/book_purple_tree.png', 'base_items/items/book_purple_volcano.png', 'base_items/items/book_red_lemon.png', 'base_items/items/book_red_sparkle.png', 'base_items/items/book_red_tree.png', 'base_items/items/book_yellow_apple.png', 'base_items/items/book_yellow_sparkle.png', 'base_items/items/book_yellow_tree.png', 'base_items/items/book_yellow_volcano.png', 'base_items/items/coin_blue.png', 'base_items/items/coin_green.png', 'base_items/items/coin_purple.png', 'base_items/items/coin_red.png', 'base_items/items/coin_silver.png', 'base_items/items/coin_yellow.png', 'base_items/items/flower_black.png', 'base_items/items/flower_blue.png', 'base_items/items/flower_green.png', 'base_items/items/flower_purple.png', 'base_items/items/flower_red.png', 'base_items/items/flower_silver.png', 'base_items/items/flower_yellow.png', 'base_items/items/gem_blue.png', 'base_items/items/gem_green.png', 'base_items/items/gem_purple.png', 'base_items/items/gem_red.png', 'base_items/items/gem_silver.png', 'base_items/items/gem_yellow.png', 'base_items/items/key_blue_key.png', 'base_items/items/key_blue_magic key.png', 'base_items/items/key_blue_spiked key.png', 'base_items/items/key_blue_triangle key.png', 'base_items/items/key_cyan_key.png', 'base_items/items/key_cyan_magic key.png', 'base_items/items/key_cyan_spiked key.png', 'base_items/items/key_cyan_triangle key.png', 'base_items/items/key_green_key.png', 'base_items/items/key_green_magic key.png', 'base_items/items/key_green_spiked key.png', 'base_items/items/key_green_triangle key.png', 'base_items/items/key_purple_key.png', 'base_items/items/key_purple_magic key.png', 'base_items/items/key_purple_spiked key.png', 'base_items/items/key_purple_triangle key.png', 'base_items/items/key_red_key.png', 'base_items/items/key_red_magic key.png', 'base_items/items/key_red_spiked key.png', 'base_items/items/key_red_triangle key.png', 'base_items/items/key_silver_key.png', 'base_items/items/key_silver_magic key.png', 'base_items/items/key_silver_spiked key.png', 'base_items/items/key_silver_triangle key.png', 'base_items/items/key_yellow_key.png', 'base_items/items/key_yellow_magic key.png', 'base_items/items/key_yellow_spiked key.png', 'base_items/items/key_yellow_triangle key.png', 'base_items/items/leaf_blue.png', 'base_items/items/leaf_green.png', 'base_items/items/leaf_purple.png', 'base_items/items/leaf_red.png', 'base_items/items/leaf_silver.png', 'base_items/items/leaf_yellow.png', 'base_items/items/orb_blue_bomb.png', 'base_items/items/orb_blue_dagger.png', 'base_items/items/orb_blue_explosion.png', 'base_items/items/orb_blue_flame.png', 'base_items/items/orb_blue_gem.png', 'base_items/items/orb_blue_ghost.png', 'base_items/items/orb_blue_leaf.png', 'base_items/items/orb_cyan_bomb.png', 'base_items/items/orb_cyan_dagger.png', 'base_items/items/orb_cyan_explosion.png', 'base_items/items/orb_cyan_flame.png', 'base_items/items/orb_cyan_gem.png', 'base_items/items/orb_cyan_ghost.png', 'base_items/items/orb_cyan_leaf.png', 'base_items/items/orb_green_bomb.png', 'base_items/items/orb_green_dagger.png', 'base_items/items/orb_green_explosion.png', 'base_items/items/orb_green_flame.png', 'base_items/items/orb_green_gem.png', 'base_items/items/orb_green_ghost.png', 'base_items/items/orb_purple_bomb.png', 'base_items/items/orb_purple_dagger.png', 'base_items/items/orb_purple_explosion.png', 'base_items/items/orb_purple_flame.png', 'base_items/items/orb_purple_gem.png', 'base_items/items/orb_purple_ghost.png', 'base_items/items/orb_purple_leaf.png', 'base_items/items/orb_red_bomb.png', 'base_items/items/orb_red_dagger.png', 'base_items/items/orb_red_explosion.png', 'base_items/items/orb_red_flame.png', 'base_items/items/orb_red_gem.png', 'base_items/items/orb_red_ghost.png', 'base_items/items/orb_red_leaf.png', 'base_items/items/orb_silver_bomb.png', 'base_items/items/orb_silver_dagger.png', 'base_items/items/orb_silver_explosion.png', 'base_items/items/orb_silver_flame.png', 'base_items/items/orb_silver_gem.png', 'base_items/items/orb_silver_ghost.png', 'base_items/items/orb_silver_leaf.png', 'base_items/items/orb_yellow_bomb.png', 'base_items/items/orb_yellow_dagger.png', 'base_items/items/orb_yellow_explosion.png', 'base_items/items/orb_yellow_flame.png', 'base_items/items/orb_yellow_gem.png', 'base_items/items/orb_yellow_ghost.png', 'base_items/items/orb_yellow_leaf.png', 'base_items/items/potion_black.png', 'base_items/items/potion_blue.png', 'base_items/items/potion_green.png', 'base_items/items/potion_purple.png', 'base_items/items/potion_red.png', 'base_items/items/potion_silver.png', 'base_items/items/potion_yellow.png', 'base_items/items/ring_black_cyan.png', 'base_items/items/ring_black_red.png', 'base_items/items/ring_black_silver.png', 'base_items/items/ring_black_yellow.png', 'base_items/items/ring_blue_black.png', 'base_items/items/ring_blue_cyan.png', 'base_items/items/ring_blue_red.png', 'base_items/items/ring_blue_silver.png', 'base_items/items/ring_blue_yellow.png', 'base_items/items/ring_cyan_black.png', 'base_items/items/ring_cyan_red.png', 'base_items/items/ring_cyan_silver.png', 'base_items/items/ring_cyan_yellow.png', 'base_items/items/ring_green_black.png', 'base_items/items/ring_green_cyan.png', 'base_items/items/ring_green_red.png', 'base_items/items/ring_green_silver.png', 'base_items/items/ring_green_yellow.png', 'base_items/items/ring_purple_black.png', 'base_items/items/ring_purple_cyan.png', 'base_items/items/ring_purple_red.png', 'base_items/items/ring_purple_silver.png', 'base_items/items/ring_purple_yellow.png', 'base_items/items/ring_red_black.png', 'base_items/items/ring_red_cyan.png', 'base_items/items/ring_red_silver.png', 'base_items/items/ring_red_yellow.png', 'base_items/items/scroll_blue_fire.png', 'base_items/items/scroll_blue_leaf.png', 'base_items/items/scroll_blue_lightning.png', 'base_items/items/scroll_blue_spiral.png', 'base_items/items/scroll_cyan_fire.png', 'base_items/items/scroll_cyan_leaf.png', 'base_items/items/scroll_cyan_lightning.png', 'base_items/items/scroll_cyan_spiral.png', 'base_items/items/scroll_cyan_water.png', 'base_items/items/scroll_gray3_fire.png', 'base_items/items/scroll_gray3_leaf.png', 'base_items/items/scroll_gray3_lightning.png', 'base_items/items/scroll_gray3_spiral.png', 'base_items/items/scroll_gray3_water.png', 'base_items/items/scroll_green_fire.png', 'base_items/items/scroll_green_lightning.png', 'base_items/items/scroll_green_spiral.png', 'base_items/items/scroll_green_water.png', 'base_items/items/scroll_red_leaf.png', 'base_items/items/scroll_red_lightning.png', 'base_items/items/scroll_red_spiral.png', 'base_items/items/scroll_red_water.png', 'base_items/items/scroll_yellow_fire.png', 'base_items/items/scroll_yellow_leaf.png', 'base_items/items/scroll_yellow_spiral.png', 'base_items/items/scroll_yellow_water.png', 'base_items/items/star_black.png', 'base_items/items/star_blue.png', 'base_items/items/star_green.png', 'base_items/items/star_purple.png', 'base_items/items/star_red.png', 'base_items/items/star_silver.png', 'base_items/items/star_yellow.png', 'base_items/items/wand_blue.png', 'base_items/items/wand_green.png', 'base_items/items/wand_purple.png', 'base_items/items/wand_red.png', 'base_items/items/wand_silver.png', 'base_items/items/wand_yellow.png', 'base_items/monsters/blob_black.png', 'base_items/monsters/blob_black_attack.png', 'base_items/monsters/blob_blue.png', 'base_items/monsters/blob_blue_attack.png', 'base_items/monsters/blob_green.png', 'base_items/monsters/blob_green_attack.png', 'base_items/monsters/blob_purple.png', 'base_items/monsters/blob_purple_attack.png', 'base_items/monsters/blob_red.png', 'base_items/monsters/blob_red_attack.png', 'base_items/monsters/blob_white.png', 'base_items/monsters/blob_white_attack.png', 'base_items/monsters/blob_yellow.png', 'base_items/monsters/blob_yellow_attack.png', 'base_items/monsters/chicken_blue.png', 'base_items/monsters/chicken_blue_attack.png', 'base_items/monsters/chicken_green.png', 'base_items/monsters/chicken_green_attack.png', 'base_items/monsters/chicken_purple.png', 'base_items/monsters/chicken_purple_attack.png', 'base_items/monsters/chicken_white.png', 'base_items/monsters/chicken_white_attack.png', 'base_items/monsters/chicken_yellow.png', 'base_items/monsters/chicken_yellow_attack.png', 'base_items/monsters/dragon_black.png', 'base_items/monsters/dragon_black_attack.png', 'base_items/monsters/dragon_blue.png', 'base_items/monsters/dragon_blue_attack.png', 'base_items/monsters/dragon_green.png', 'base_items/monsters/dragon_green_attack.png', 'base_items/monsters/dragon_purple.png', 'base_items/monsters/dragon_purple_attack.png', 'base_items/monsters/dragon_red.png', 'base_items/monsters/dragon_red_attack.png', 'base_items/monsters/dragon_white.png', 'base_items/monsters/dragon_white_attack.png', 'base_items/monsters/dragon_yellow.png', 'base_items/monsters/dragon_yellow_attack.png', 'base_items/monsters/fairy_black.png', 'base_items/monsters/fairy_black_attack.png', 'base_items/monsters/fairy_blue.png', 'base_items/monsters/fairy_blue_attack.png', 'base_items/monsters/fairy_green.png', 'base_items/monsters/fairy_green_attack.png', 'base_items/monsters/fairy_purple.png', 'base_items/monsters/fairy_purple_attack.png', 'base_items/monsters/fairy_red.png', 'base_items/monsters/fairy_red_attack.png', 'base_items/monsters/fairy_white.png', 'base_items/monsters/fairy_white_attack.png', 'base_items/monsters/fairy_yellow.png', 'base_items/monsters/fairy_yellow_attack.png', 'base_items/monsters/goblin_black.png', 'base_items/monsters/goblin_black_attack.png', 'base_items/monsters/goblin_blue.png', 'base_items/monsters/goblin_blue_attack.png', 'base_items/monsters/goblin_green.png', 'base_items/monsters/goblin_green_attack.png', 'base_items/monsters/goblin_red.png', 'base_items/monsters/goblin_red_attack.png', 'base_items/monsters/goblin_yellow.png', 'base_items/monsters/goblin_yellow_attack.png', 'base_items/monsters/insect_black.png', 'base_items/monsters/insect_black_attack.png', 'base_items/monsters/insect_blue.png', 'base_items/monsters/insect_blue_attack.png', 'base_items/monsters/insect_green.png', 'base_items/monsters/insect_green_attack.png', 'base_items/monsters/insect_purple.png', 'base_items/monsters/insect_purple_attack.png', 'base_items/monsters/insect_red.png', 'base_items/monsters/insect_red_attack.png', 'base_items/monsters/insect_white.png', 'base_items/monsters/insect_white_attack.png', 'base_items/monsters/insect_yellow.png', 'base_items/monsters/insect_yellow_attack.png', 'base_items/monsters/living_armor_black.png', 'base_items/monsters/living_armor_black_attack.png', 'base_items/monsters/living_armor_blue.png', 'base_items/monsters/living_armor_blue_attack.png', 'base_items/monsters/living_armor_green.png', 'base_items/monsters/living_armor_green_attack.png', 'base_items/monsters/living_armor_purple.png', 'base_items/monsters/living_armor_purple_attack.png', 'base_items/monsters/living_armor_red.png', 'base_items/monsters/living_armor_red_attack.png', 'base_items/monsters/living_armor_white.png', 'base_items/monsters/living_armor_white_attack.png', 'base_items/monsters/living_armor_yellow.png', 'base_items/monsters/living_armor_yellow_attack.png', 'base_items/monsters/magic_sword_black.png', 'base_items/monsters/magic_sword_black_attack.png', 'base_items/monsters/magic_sword_blue.png', 'base_items/monsters/magic_sword_blue_attack.png', 'base_items/monsters/magic_sword_green.png', 'base_items/monsters/magic_sword_green_attack.png', 'base_items/monsters/magic_sword_purple.png', 'base_items/monsters/magic_sword_purple_attack.png', 'base_items/monsters/magic_sword_red.png', 'base_items/monsters/magic_sword_red_attack.png', 'base_items/monsters/magic_sword_white.png', 'base_items/monsters/magic_sword_white_attack.png', 'base_items/monsters/magic_sword_yellow.png', 'base_items/monsters/magic_sword_yellow_attack.png', 'base_items/monsters/tree_black.png', 'base_items/monsters/tree_black_attack.png', 'base_items/monsters/tree_blue.png', 'base_items/monsters/tree_blue_attack.png', 'base_items/monsters/tree_green.png', 'base_items/monsters/tree_green_attack.png', 'base_items/monsters/tree_purple.png', 'base_items/monsters/tree_purple_attack.png', 'base_items/monsters/tree_red.png', 'base_items/monsters/tree_red_attack.png', 'base_items/monsters/tree_white.png', 'base_items/monsters/tree_white_attack.png', 'base_items/monsters/tree_yellow.png', 'base_items/monsters/tree_yellow_attack.png', 'base_items/monsters/wisp_blue.png', 'base_items/monsters/wisp_blue_attack.png', 'base_items/monsters/wisp_green.png', 'base_items/monsters/wisp_green_attack.png', 'base_items/monsters/wisp_purple.png', 'base_items/monsters/wisp_purple_attack.png', 'base_items/monsters/wisp_red.png', 'base_items/monsters/wisp_red_attack.png', 'base_items/monsters/wisp_white.png', 'base_items/monsters/wisp_white_attack.png', 'base_items/monsters/wisp_yellow.png', 'base_items/monsters/wisp_yellow_attack.png', 'base_items/monsters/wraith_blue.png', 'base_items/monsters/wraith_blue_attack.png', 'base_items/monsters/wraith_green.png', 'base_items/monsters/wraith_green_attack.png', 'base_items/monsters/wraith_purple.png', 'base_items/monsters/wraith_purple_attack.png', 'base_items/monsters/wraith_red.png', 'base_items/monsters/wraith_red_attack.png', 'base_items/monsters/wraith_yellow.png', 'base_items/monsters/wraith_yellow_attack.png', 'images/background.png', 'images/bg2.png', 'images/bg3.png', 'images/bg4.png', 'images/bg5.png', 'images/bg6.png', 'images/bgpreamble.png', 'images/bgwin.png', 'images/bgstart.png', 'images/cauldron.png', 'images/closed_town.png', 'images/coin.png', 'images/escorted.png', 'images/faded_town.png', 'images/fairy.png', 'images/open_town.png', 'images/player_maze.png', 'images/portal.png', 'images/tree_maze.png', 'monsters/gun.png', 'monsters/gun2.png', 'monsters/laser.png', 'monsters/laser2.png', 'monsters/lunge.png', 'monsters/pursuit.png', 'monsters/pursuit2.png', 'monsters/wander.png', 'monsters/wander2.png', 'player/arm down.png', 'player/arm down2.png', 'player/arm up.png', 'player/arm up2.png', 'player/person.png', 'player/person2.png', 'player/personb.png', 'player/personb2.png', 'trees/0.png', 'trees/0resized.png', 'trees/0resizedtrans.png', 'trees/1.png', 'trees/1resized.png', 'trees/1resizedtrans.png', 'trees/2.png', 'trees/2resized.png', 'trees/2resizedtrans.png', 'trees/3.png', 'trees/3resized.png', 'trees/3resizedtrans.png', 'trees/4.png', 'trees/4resized.png', 'trees/4resizedtrans.png']

      let promises = Promise.allSettled(image_files.map(x => loadImage( x)))
      
      promises.then(() => setLoading(false)); 
      return  loading ? <>"loading"</> :<> 
      
      <img src={"images/bgstart.png"} style={{position:"absolute",zIndex:-1,top:0,left:0}}/>

      <textarea style={{"position" :"absolute", "top":250,color:"white", "left":200,"width":200,"height":30,"backgroundColor":"#880000"}} >Enter seed</textarea>

      <div style={{"position" :"absolute", "top":300,fontSize:30,color:"white",padding:20, "left":200,"width":200,"height":100,"backgroundColor":"#880000"}} onClick={() => {promises.then(() =>{ setG(new game(document.querySelector("textarea")!.value , 25)); setMode("map");})}}>Click to start</div>

      <h1 style={{color:"white",position:"absolute",zIndex:1,top:100,left:100}}>The Trail of the Wanderer</h1>
      </>; // SET NUMBER OF ELEMENTS HERE
  }
  else if (mode == "map"){
    if(g){
      return <MainMap g={g} recall={(s : string) => setMode(["town", s])} seed={g.seed} />
    } else {
      return <>no game here</>;
    }
  }
  else if (mode[0] == "town"){
    if(mode[1] == "globalwin"){
      setMode("globalwin");
      return <></>
    }
    if(g == undefined){
      setMode("menu");
    } else {
      return <Town g={g} town={mode[1]} recall={(data : any) => setMode(["prepare", data])} />; 
    }
  }  
  else if (mode[0] == "prepare"){

    if(g == undefined){
      setMode("menu");
    } else { 
      if(mode[1] == "back"){
        setMode("map");
      } else { 
        let town = mode[1];

        let sort_index = g?.sort.indexOf(town);
        let choice = g.item_tasks[town];
        prepare_level(g, choice, sort_index); 

        let data = clone_gamedata(chase_obj); 
        if(choice == "maze"){
          data = clone_gamedata(maze_obj); 
        }
        if(choice == "potions"){
          data = clone_gamedata(potions_obj); 
        }
        data.g = g;
        setGameData(data);
        //g.tick_fn =() => "victory"; // DEBUG
        setMode(["preamble", mode[1], choice]);
      }
    }
  } else if (mode[0] == "preamble"){
    let preamble : JSX.Element[] = []; 
    if(mode[2] == "fetch"){
      preamble.push(<>I need you to fetch some coins, avoid the monsters.<br /> Follow the black arrow.</>)
    }
    if(mode[2] == "maze"){
      preamble.push(<>Chop a path through this forest of trees.<br /> Get to the bottom right corner. <br /> Use as few chops as possible</>)
    }
    if(mode[2] == "escape"){
      preamble.push(<>Oh no, we're getting ambushed by monsters.<br />I've set up a portal for you. Follow the black arrow and go there.<br />Avoid being seen by monsters</>)
    }
    if(mode[2] == "potions"){
      preamble.push(<>I need your help mixing potions.<br /> Click on the potion to add them to the mix</>)
    }
    if(mode[2] == "escort"){
      preamble.push(<>My daughter wants to explore the forest. Protect her from the monsters<br /> She only moves if you're near her. </>)
    }
    
    if(mode[2] == "fairy"){
      preamble.push(<>There's a fairy that needs to be protected. Don't let her be harmed<br/>Keep in mind that your attacks will also harm her. Even your repel spell harms her. </>)
    }
    
    if(mode[2] == "kill"){
      preamble.push(<>Just go and kill a bunch of monsters.  </>)
    }
    if(mode[2] == "assassin"){
      preamble.push(<>There's a specific monster that I want dead. I'll indicate their location with a black arrow<br />All other monsters are immune to your attacks. </>)
    }

    return <><img src={"images/bgpreamble.png"} style={{position:"absolute",zIndex:-1,top:0,left:0}}/><div style={{position:"absolute",top:40,left:40, color:"white"}}>
        {preamble} 
        <br />
        Please complete this task quickly. Remember: Nothing can go wrong! 
      <br /> 
    <button onClick={()=>transition(["game", mode[1], mode[2]])}> Start</button>
    </div></>
  }
  else if (mode[0] == "game"){
      // set up game
      let delay = mode[2] == "potions" || mode[2] == "maze" ? 100 : 1000
      data.prop_fns["victory"] =  (g,s) => {if(s.flag_msg == undefined){s.flag_msg="You win!"; setTimeout(() =>transition(["win", mode[1],mode[2]]), delay)}};
      data.prop_fns["defeat"] =  (g,s) => {if(s.flag_msg == undefined){s.flag_msg="You lose!"; setTimeout(() =>transition(["lose", mode[1], mode[2]]), delay)}};
      if(mode[2] != "potions" && mode[2] != "maze"){
        if(g?.can_repel){
          data.display.button.push(["repel", [canvas_size[0] +10, 10, 100, 30], "repel (Q)"])
        }
        if(g?.can_fireball){
          data.display.button.push(["fireball", [canvas_size[0] +10,50, 100, 30], "fireball (W)"])
        }
        if(g?.can_swing){
          data.display.button.push(["sword", [canvas_size[0] +10, 90, 100, 30], "sword (E)"])
        }
      }
      return <><GameDisplay data={data} globalStore={store}/><MuteButton x={760} y = {0}/></>
      // register event listener;
  }else if (mode == "test"){
    return <Test_canvas />;
  } else if(mode[0] == "win"){
    if(g == undefined){
      throw "win undefined game"; 
    }
    g?.collected_dag.add(mode[1]);
    let ratio = g?.sort.indexOf( mode[1]) / g?.sort.length; 
    let message = "";
    let revealed = [...g.graph.get_exposed_vertices(g.collected_dag)].map(x => g.item_tasks[x]);
    if((revealed.indexOf("escort") != -1 ||revealed.indexOf("fairy") != -1 ) && g.can_repel == false){
      g.can_repel = true; 
      message = "You learned how to cast a repel spell! (press Q)"
    }
    if((revealed.indexOf("kill") != -1 ||revealed.indexOf("assassin") != -1 ) && g.can_swing == false){
      g.can_swing = true; 
      message = "You are given a sword. You can now kill monsters. (press E)"
    }
    
    if(ratio > 0.75 && g.can_fireball == false){
      g.can_fireball= true; 
      message = "You can now cast fireballs! (press W)"
    }

    return <><img src={"images/bgwin.png"} style={{position:"absolute",zIndex:-1,top:0,left:0}}/><div style={{position:"absolute",top:40,left:40}}>You win! You get <img src={"base_items/items/"+g.images[parseInt(mode[1])]}/> {g.item_names[parseInt(mode[1])]}<br />{message}
    <br />
    <button onClick={()=>transition("map")}> Go back</button></div><MuteButton x={760} y = {0}/></>
  }
  else if(mode[0] == "lose"){
    if(g == undefined){
      throw "lose undefined game"; 
    }
    return <><img src={"images/bgwin.png"} style={{position:"absolute",zIndex:-1,top:0,left:0}}/><div style={{position:"absolute",top:40,left:40}}>

    Oh no! Something went wrong! Remember: Nothing can go wrong!<br />
        {
          function(){
          if(mode[2] == "escape"){
            return "You were seen.";
          }if(mode[2] == "escort"){
            return "You failed to protect the person.";
          }if(mode[2] == "fairy"){
            return "You failed to protect the fairy.";
          }if(mode[2] == "potions"){
            return "You couldn't mix the potions"
          }if(mode[2] == "maze"){
            return "You couldn't clear a path through the maze."
          }
          
          return "You got hit by too many monsters."
        }()} 
        <br />
        You could have gotten <img src={"base_items/items/"+g.images[parseInt(mode[1])]}/> {g.item_names[parseInt(mode[1])]} but you didn't<br />
        <button onClick={()=>transition("map")}> Go back</button>
    </div><MuteButton x={760} y = {0}/></>
  }
  else if(mode == "globalwin"){
    return <><img src={"images/bgwin.png"} style={{position:"absolute",zIndex:-1,top:0,left:0}}/><div style={{position:"absolute",top:40,left:40}}>

   Congratulations! You completed every single task!
   <br />
   <br />
        <button onClick={()=>transition("menu")}> Go back</button>
    </div></>
  }
  return "none of the modes match - " + mode;  

}


export default App
import { useState } from 'react'
import game, {  repel_spell } from './game';

import { data_obj as chase_obj  } from './chase_gameData';
import { data_obj as maze_obj } from './maze_gameData';
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

// mousemove
function move_canvas(e : MouseEvent, g:game, store : globalStore_type){
  if((e.target as HTMLElement).getAttribute("data-key")?.indexOf("main_canvas") != -1){ // topmost canvas element that is valid
      store.mouse_pos = [e.offsetX, e.offsetY];// set mouse position 
  }
}
function click_fn(e : MouseEvent, g : game, store : globalStore_type ){
  if(g.mode == "potions"){
    // clicked on a potion
    let start_coord = lincomb(1, potion_start, -0.5, [potion_size,potion_size]) as point;
    let index = cell_index(start_coord, potion_size, potion_size, potions_per_row, e.offsetX, e.offsetY);
    if(index != undefined){
      let potion = g.potions[index[2]];
      if(g.already_put.indexOf(potion) == -1){
        store.potion_anim_state = {color : g.potions[index[2]], "place" : [cauldron_pos[0]+150, 100]}
      }
    }
  }
}

function keydown(e : KeyboardEvent, g : game, store : globalStore_type ){
  let direction_vector : point = lincomb(1, store.mouse_pos, -1, store.player_pos) as point;  
  if(direction_vector[0] == 0 && direction_vector[1] == 0){
    direction_vector = [0,1];
  }
  if(g.mode == "maze"){
    if(e.key.toLowerCase() == "w"){
      store.maze_msg = g.move_maze([0, -1])
    }
    if(e.key.toLowerCase() == "a"){
      store.maze_msg = g.move_maze([-1,0])
    }
    if(e.key.toLowerCase() == "s"){
      store.maze_msg = g.move_maze([0, 1])
    }
    if(e.key.toLowerCase() == "d"){
      store.maze_msg = g.move_maze([1, 0])
    }
  } else if(g.mode != "potions"){
    if(e.key.toLowerCase() == "q"){
      if(g.can_repel && g.time - g.last_repel >= 60){
        g.cast_repel_spell(direction_vector[0], direction_vector[1], 60,84);
      }
    }
    if(e.key.toLowerCase() == "w"){
      if(g.can_fireball && g.time - g.last_fireball >= 60){
        g.cast_fireball_spell(direction_vector[0], direction_vector[1], 60,84);
      }
    }
    if(e.key.toLowerCase() == "e"){
      if(g.can_swing && g.time - g.last_swing >= 30){
        g.start_swing(100, Math.atan2(direction_vector[1], direction_vector[0]),  15,0.2);
      }
    }  
  }
}

  // default store, override it if necessary 


function App() {
  const [g, setG] = useState<game | undefined>(undefined);
  const [mode, setMode] = useState<exp_modes >("menu");
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [data, setGameData] = useState<gamedata>(clone_gamedata(chase_obj)); 
  function transition(s : exp_modes){
    setTransitioning(true);
    setTimeout(() => {setMode(s); setTransitioning(false)}, 0);
  }

  if(transitioning){
    return <>asdsasd</>
  }

  let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, player_last_pos : [0,0] , mouse_pos : [0,0]}; 
  
  events["mousemove a"] = [move_canvas, null]
  events["click a"] = [click_fn, null]
  events["keydown a"] = [keydown, null];
  if(transitioning){
    return <> asdaakjd</>
  }
  if(mode == "menu"){
      let image_files = ['background.png', 'bg2.png', 'bg3.png', 'bg4.png', 'bg5.png', 'cauldron.png', 'closed_town.png', 'coin.png', 'escorted.png', 'monster.png', 'open_town.png', 'person.png', 'player.png', 'player_maze.png', 'roaming_monster.png', 'seeing_monster.png', 'targeted_monster.png', 'thingy.png', 'tree.png'];

      let promises = Promise.allSettled(image_files.map(x => loadImage("images/" + x)))
    
      return <button onClick={() => {promises.then(() =>{ setG(new game("a", 50)); setMode("map");})}}>Click to start</button>;
  }
  else if (mode == "map"){
    if(g){
      return <MainMap g={g} recall={(s : string) => setMode(["town", s])}/>
    } else {
      return <>no game here</>;
    }
  }
  else if (mode[0] == "town"){
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
        setMode(["game", mode[1], mode[2]]);
      }
    }
  }
  else if (mode[0] == "game"){
      // set up game
      data.prop_fns["victory"] =  (g,s) => {if(s.flag_msg == undefined){s.flag_msg="You win!"; setTimeout(() =>transition(["win", mode[1],mode[2]]), 1000)}};
      data.prop_fns["defeat"] =  (g,s) => {if(s.flag_msg == undefined){s.flag_msg="You lose!"; setTimeout(() =>transition(["lose", mode[1], mode[2]]), 1000)}};
      return <GameDisplay data={data} globalStore={store}/>
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
    
    if(ratio > 0.8 && g.can_fireball == false){
      g.can_fireball= true; 
      message = "You can now cast fireballs! (press W)"
    }

    return <>You win! You get {mode[1]}<br />{message}
    <br />
    <button onClick={()=>transition("map")}> Go back</button></>
  }
  else if(mode[0] == "lose"){
    return <>Oh no! Something went wrong! Remember: Nothing can go wrong!<br />
    {
      function(){
      if(mode[2] == "escape"){
        return "You were seen.";
      }if(mode[2] == "escort"){
        return "You failed to protect the person.";
      }if(mode[2] == "fairy"){
        return "You failed to protect the fairy.";
      }
      return "You got hit by too many monsters."
    }()} <br />
    You could have gotten {mode[1]} but you didn't <button onClick={()=>transition("map")}> Go back</button></>
  }
  return "none of the modes match - " + mode;  

}


export default App
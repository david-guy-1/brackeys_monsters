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
  if(e.key.toLowerCase() == "q"){
    g.cast_repel_spell(direction_vector[0], direction_vector[1], 60,84);
  }
  if(e.key.toLowerCase() == "w"){
    g.cast_fireball_spell(direction_vector[0], direction_vector[1], 60,84);
  }
  if(e.key.toLowerCase() == "e"){
    g.start_swing(100, Math.atan2(direction_vector[1], direction_vector[0]),  15,0.2);
    
  }
}

function App() {
  const [g, setG] = useState<game | undefined>(undefined);
  const [mode, setMode] = useState<exp_modes >("menu");
  const [transitioning, setTransitioning] = useState<boolean>(false);
  function transition(s : exp_modes){
    setTransitioning(true);
    setTimeout(() => {setMode(s); setTransitioning(false)}, 0);
  }
  if(transitioning){
    return <></>
  }
  // default store, override it if necessary 
  let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, player_last_pos : [0,0] , mouse_pos : [0,0]}; 
  const [data, setGameData] = useState<gamedata>(clone_gamedata(chase_obj));
  events["mousemove a"] = [move_canvas, null]
  events["click a"] = [click_fn, null]
  events["keydown a"] = [keydown, null];
  if(mode == "menu"){
      let image_files = ['background.png', 'bg2.png', 'bg3.png', 'bg4.png', 'bg5.png', 'cauldron.png', 'closed_town.png', 'coin.png', 'escorted.png', 'monster.png', 'open_town.png', 'person.png', 'player.png', 'player_maze.png', 'roaming_monster.png', 'seeing_monster.png', 'targeted_monster.png', 'thingy.png', 'tree.png'];

      let promises = Promise.allSettled(image_files.map(x => loadImage("images/" + x)))
    
      return <button onClick={() => {promises.then(() =>{ setG(new game("a", 30)); setMode("map");})}}>Click to start</button>;
  }
  else if (mode == "map"){
    if(g){
      return <MainMap g={g} recall={(s : exp_modes) => transition(s)}/>
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
        let choice = "fetch maze escape potions defend escort kill fairy assassin"
        
        g?.setup_chase(2000, 2000)
        let data = clone_gamedata(chase_obj); 
        data.g = g;
        g.tick_fn = () => {return undefined};
        setGameData(data);
        setMode("game");
      }
    }
  }
  else if (mode == "game"){
      // set up game
      data.prop_fns["victory"] =  () => transition("map");
      data.prop_fns["defeat"] =  () => transition("map");
      return <GameDisplay data={data} globalStore={store}/>
      // register event listener;
  }else if (mode == "test"){
    return <Test_canvas />;
  }
  return "none of the modes match - " + mode;  

}


export default App
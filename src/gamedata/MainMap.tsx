import { useEffect, useRef } from "react";
import { canvas_size } from "./constants";
import game from "./game";
import { dist } from "../lines";
import { draw } from "../process_draws";
import { d_image } from "../canvasDrawing";

function handleClick(e : MouseEvent,g : game, recall : (s : string)=> void){
    console.log([e.offsetX, e.offsetY]);
    for(let town of Object.keys(g.town_locations)){
        let loc = g.town_locations[town];
        if(dist([e.offsetX, e.offsetY], loc) < 20){
            recall(town);
            break;
        }
    }
}

function MainMap({g,recall} : {g : game ,recall : (s : string) => void} ){
    let x = useRef<HTMLCanvasElement>(null); 
    useEffect(function(){
        let lst : draw_command[] = []; 
        lst.push(d_image("images/bg5.png", [0,0]));
        let exposed = g.graph.get_exposed_vertices(g.collected_dag)

        for(let town of Object.keys(g.town_locations)){
            let loc = g.town_locations[town];
            let town_data = g.towns[town];
            if(town_data.intersection(town_data).size > 0){
                lst.push(d_image("images/open_town.png", loc));
            }  else {
                lst.push(d_image("images/closed_town.png", loc));
            }
        }
        console.log(lst);
        draw(lst, x as React.RefObject<HTMLCanvasElement> );
    },[])
    return <><canvas ref={x} width={canvas_size[0]} height={canvas_size[1]} onClick={(e) => handleClick(e.nativeEvent,g,  recall)}></canvas></>;

}

export default MainMap;
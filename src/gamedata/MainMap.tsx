import { useEffect, useRef } from "react";
import { canvas_size, min_town_dist } from "./constants";
import game from "./game";
import { dist, lincomb } from "../lines";
import { draw } from "../process_draws";
import { d_image, d_text } from "../canvasDrawing";

function handleClick(e : MouseEvent,g : game, recall : (s : string)=> void){
    for(let town of Object.keys(g.town_locations)){
        let loc = g.town_locations[town];
        if(dist([e.offsetX, e.offsetY], loc) < min_town_dist * 0.5){
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
            let loc = lincomb(1, g.town_locations[town], -1,[20,20]);
            let town_data = g.towns[town];
            if(town_data.intersection(exposed.union(g.collected_dag)).size > 0){
                if(town_data.intersection(exposed).size == 0){
                    lst.push(d_image("images/faded_town.png", loc));
                } else {
                    lst.push(d_image("images/open_town.png", loc));
                }
                
            }  else {
                lst.push(d_image("images/closed_town.png", loc));
            }
        }
        // bottom text
        let bottom_text = "";
        if(g.can_repel){
            bottom_text += "Repel (Q) "
        }
    
        if(g.can_fireball){
            bottom_text += "Fireball (W) "
        }
        
        if(g.can_swing){
            bottom_text += "Swird (E) "
        }
        lst.push(d_text(bottom_text, 10, canvas_size[1]-10));
        draw(lst, x as React.RefObject<HTMLCanvasElement> );
    },[])
    return <><canvas ref={x} width={canvas_size[0]+200} height={canvas_size[1]} style={{position:"absolute",top:0,left:0}} onClick={(e) => handleClick(e.nativeEvent,g,  recall)}></canvas><div style={{position:"absolute",top:0,left:canvas_size[0],width:200}}>{[...g.collected_dag].map(x => <img src={"base_items/items/" + g.images[parseInt(x)]}/>)}</div></>;

}

export default MainMap;
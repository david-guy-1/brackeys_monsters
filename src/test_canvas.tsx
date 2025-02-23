import { useRef, useEffect } from "react";
import { draw } from "./process_draws";
import { flatten } from "lodash";
import { add_com, d_bezier, d_circle, drawBezierShape, make_style } from "./canvasDrawing";
import { displace_command, rotate_command, scale_command } from "./rotation";
import { lincomb, scalar_multiple } from "./lines";

let commands : draw_command[] = []

let outer : point[] = [[-17,204],[-19,227],[-20,250],[-44,257],[-63,266],[-73,290],[-65,308],[-40,332],[-9,336],[51,330],[76,324],[90,290],[80,264],[68,253],[43,246],[36,245],[32,235],[31,213],[29,202]]

let inner : point[]= [[-24,260],[-40,265],[-54,279],[-47,297],[-33,313],[-7,320],[20,320],[51,314],[72,304],[69,276],[59,264],[36,259],[2,259]]

let center = [8,289];
let outer_command = d_bezier(outer, true)[0] as drawBezierShape_command;
outer_command.color = "black"

let inner_command = d_bezier(inner, true)[0] as drawBezierShape_command;
inner_command.color = "red"

commands = [outer_command, inner_command];

commands = commands.map(x => displace_command(x, scalar_multiple(-1, center) as point));

commands = commands.map(x => scale_command(x, [0,0], 0.25, 0.25));
// boilerplate 

commands = commands.map(x => displace_command(x, [300,300]));

function test_canvas(){
    let canvasRef = useRef<HTMLCanvasElement>(null); 
    useEffect(function(){
        //@ts-ignore
        draw(commands, canvasRef)
    }, [])

    return <canvas width={600} height={600} style={{"border": "1px solid black"}} ref={canvasRef} id="test_canvas"></canvas>

}

export default test_canvas;
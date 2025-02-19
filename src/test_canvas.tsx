import { useRef, useEffect } from "react";
import { draw } from "./process_draws";
import { flatten } from "lodash";
import { add_com, d_bezier, d_circle, drawBezierShape, make_style } from "./canvasDrawing";
import { displace_command, rotate_command, scale_command } from "./rotation";
import { lincomb } from "./lines";

let commands : draw_command[] = []

let swing : point[] = [[2,378],[22,346],[35,297],[32,249],[31,219],[22,177],[17,151],[8,123],[4,106],[-1,93],[14,109],[25,126],[35,154],[42,178],[47,212],[47,248],[45,292],[44,317],[32,355],[21,373],[12,388],[2,383]]

let sword_command = d_bezier(swing, true)[0] as drawBezierShape_command;
sword_command.color = {"type":"fill_radial", "x0" : -263, "y0" : 245, "r0" : 1, "x1" : -263, "y1" : 245, "r1" : 317, colorstops : [[0.93, "#cccccc"], [1, "#333333"]] };

sword_command = scale_command(displace_command(sword_command, [-2, -378]),[0,0], 100/269, 100/269) as drawBezierShape_command
sword_command = rotate_command(sword_command, [0,0], Math.PI/2) as drawBezierShape_command;
commands.push(sword_command)

// boilerplate 

console.log(JSON.stringify(commands[0]));
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
import { useRef, useEffect } from "react";
import { draw } from "./process_draws";
import { flatten } from "lodash";
import { add_com, d_bezier, d_circle, drawBezierShape } from "./canvasDrawing";
import { displace_command, rotate_command, scale_command } from "./rotation";

let commands : draw_command[] = []
let arc : point[] =  [[5,185],[12,202],[15,221],[14,245],[24,257],[32,261],[40,263]]

function y_flip(p : point, y : number){
    let dist = y - p[1]
    return [p[0], y + dist ]
}

function x_magnify(p : point, amount : number){
    return [p[0] * amount , p[1]];
}

let initial_points : point[] = [[0, 185],[4,202],[6,221],[3,245],[5,257],[8,261],[11,263]]

let bottom_points = initial_points.slice(0, initial_points.length-1).reverse().map(x => y_flip(x, 263) as point); 

let left_points = initial_points.concat(bottom_points);


let points : point[] = left_points.concat(left_points.slice(0 , left_points.length-1).reverse().map(x => x[0] == 11 ? x_magnify(x, 2) as point : (x[0] == 8 ? x_magnify(x, 3) as point: x_magnify(x, 5) as point))); 

console.log(points)

let style : fill_linear = {"type":"fill_linear", x0 :0, y0 : 263, x1 : 11, y1 : 263, colorstops : [[0, "#ffffff"], [0.9, "#ccccff"], [1, "#bbbbff"]] };

let cmd = add_com(d_bezier(points, true)[0], {color:style}) as draw_command;


cmd = displace_command(cmd, [0,-263]);
cmd = scale_command(cmd, [0,0], 1, 100/156);
cmd = rotate_command(cmd, [0,0], 1); 
cmd = displace_command(cmd, [100,100]);
console.log(JSON.stringify(cmd));
commands = commands.concat(JSON.parse(JSON.stringify(cmd)));


function test_canvas(){
    let canvasRef = useRef<HTMLCanvasElement>(null); 
    useEffect(function(){
        //@ts-ignore
        draw(commands, canvasRef)
    }, [])

    return <canvas width={600} height={600} style={{"border": "1px solid black"}} ref={canvasRef} id="test_canvas"></canvas>

}

export default test_canvas;
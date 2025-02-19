import { useRef, useEffect } from "react";
import { draw } from "./process_draws";
import { flatten } from "lodash";
import { add_com, d_bezier, d_circle, drawBezierShape, make_style } from "./canvasDrawing";
import { displace_command, rotate_command, scale_command } from "./rotation";
import { lincomb } from "./lines";

let commands : draw_command[] = []

let fireball : point[] = [[-31,151],[-1,137],[56,120],[120,134],[154,148],[182,176],[194,210],[204,243],[186,283],[150,312],[123,330],[104,337],[77,336],[51,337],[20,331],[-10,320],[-30,316],[-44,316],[-71,309],[-94,305],[-112,302],[-146,300],[-95,295],[-71,289],[-47,289],[-79,281],[-104,276],[-143,268],[-107,259],[-88,259],[-52,246],[-78,242],[-104,243],[-148,236],[-132,230],[-104,227],[-53,218],[-77,209],[-101,209],[-148,202],[-119,191],[-90,181],[-58,163]]

let center = [58,231];

commands = d_bezier(fireball, true);

(commands[0] as drawBezierShape_command).color = {"type":"fill_radial", "x0" : center[0], "y0": center[1], "r0":1 , "x1" : center[0], "y1" : center[1], "r1":140, colorstops : [[0, "white"], [0.3, "yellow"], [1, "red"]]}

commands = commands.map(x => scale_command(displace_command(x, lincomb(-1, center, 1, [0,0]) as point ), [0,0],0.3, 0.3));

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
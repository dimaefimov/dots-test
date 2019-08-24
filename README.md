# Dots-test

        import { Area } from'./Area.js';

        document.addEventListener('DOMContentLoaded', ()=>{
            let container = document.getElementById('dots-app-root');
            if(container){
                let area = new Area();
                area.init(container);
            }
        });

Можно запустить с параметрами:

        let params = {
            tickInterval:1,
            numberOfDots:1000,
            maxScrambleForce:50,
            scrambleForceFalloff:0.9,
            bufferDistance:30,
            point:{
                speed:3,
                colorLonely:'#ffffff',
                colorCrowded:'#268ae0',
                radius:10
            }
        };

        let area = new Area(params);



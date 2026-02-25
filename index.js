const express = require('express');
const { createCanvas } = require('@napi-rs/canvas');
const GIFEncoder = require('gif-encoder-2');

const app = express();
const port = 3000;

app.get('/contador', (req, res) => {
    // 1. Variables dinámicas desde Emarsys
    const fechaTermino = req.query.termino ? new Date(req.query.termino) : new Date();
    const colorTexto = req.query.color ? `#${req.query.color}` : '#E63946';
    const colorFondo = req.query.bg ? `#${req.query.bg}` : '#ffffff'; // <-- Volvemos al fondo sólido
    const fontName = req.query.font || 'Arial';
    const fontSize = req.query.size || '36';
    const fontWeight = req.query.weight || 'bold'; 

    const width = 400;
    const height = 100;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    const encoder = new GIFEncoder(width, height);
    encoder.start();
    encoder.setRepeat(0);   
    encoder.setDelay(1000); 

    // Revisamos si la fecha ya pasó antes de empezar a dibujar
    const ahoraInicial = new Date().getTime();
    const diferenciaInicial = fechaTermino.getTime() - ahoraInicial;

    if (diferenciaInicial <= 0) {
        // ESTADO CERO: Si la oferta ya terminó, dibujamos un solo frame estático
        ctx.fillStyle = colorFondo;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = colorTexto; 
        ctx.font = `${fontWeight} ${fontSize}px "${fontName}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("¡Oferta finalizada!", width / 2, height / 2);

        encoder.addFrame(ctx); // Un solo frame, no pesa nada y no parpadea
    } else {
        // ESTADO NORMAL: Hacemos el loop de 60 segundos
        const frames = 60;
        for (let i = 0; i < frames; i++) {
            const ahora = new Date().getTime() + (i * 1000);
            const diferencia = fechaTermino.getTime() - ahora;
            const tiempoRestante = diferencia > 0 ? diferencia : 0;
            
            const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
            const horas = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((tiempoRestante % (1000 * 60)) / 1000);
            
            const texto = `${dias}d ${horas.toString().padStart(2, '0')}h ${minutos.toString().padStart(2, '0')}m ${segundos.toString().padStart(2, '0')}s`;

            // Fondo sólido para un anti-aliasing perfecto
            ctx.fillStyle = colorFondo;
            ctx.fillRect(0, 0, width, height);
            
            // Texto dinámico
            ctx.fillStyle = colorTexto; 
            ctx.font = `${fontWeight} ${fontSize}px "${fontName}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(texto, width / 2, height / 2);

            encoder.addFrame(ctx);
        }
    }

    encoder.finish();
    const buffer = encoder.out.getData(); 
    
    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    res.end(buffer, 'binary');
});

app.listen(port, () => {
    console.log(`🚀 Servidor listo en http://localhost:${port}`);
});
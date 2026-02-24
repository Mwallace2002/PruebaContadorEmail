const express = require('express');
const { createCanvas } = require('@napi-rs/canvas');
const GIFEncoder = require('gif-encoder-2');

const app = express();
const port = 3000;

app.get('/contador', (req, res) => {
    // 1. Capturamos las variables que vienen de Emarsys por la URL
    const fechaTermino = req.query.termino ? new Date(req.query.termino) : new Date();
    
    // El color viene de Emarsys SIN el "#" (ej: E63946), así que se lo agregamos aquí
    const colorTexto = req.query.color ? `#${req.query.color}` : '#E63946';
    // Capturamos la fuente y el tamaño (con valores por defecto si vienen vacíos)
    const fontName = req.query.font || 'Arial';
    const fontSize = req.query.size || '36';
    // EXTRA: Siempre es bueno poder controlar el fondo para que combine con el email
    const colorFondo = req.query.bg ? `#${req.query.bg}` : '#ffffff';

    const width = 400;
    const height = 100;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    const encoder = new GIFEncoder(width, height);
    encoder.start();
    encoder.setRepeat(0);   
    encoder.setDelay(1000); 

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

        // 2. Aplicamos las variables al dibujo
        
        // Dibujamos el fondo dinámico
        ctx.fillStyle = colorFondo;
        ctx.fillRect(0, 0, width, height);
        
        // Dibujamos el texto con el color, tamaño y fuente dinámicos
        ctx.fillStyle = colorTexto; 
        ctx.font = `bold ${fontSize}px ${fontName}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(texto, width / 2, height / 2);

        encoder.addFrame(ctx);
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
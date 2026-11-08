import './styles/base.css';
import './styles/intro.css';
import './styles/docs.css';
import './styles/q2-demos.css';
import './styles/assignment-polish.css';
import './styles/manual.css';
import './styles/print.css';
import { go, ids } from './router.js';
import { startIntro } from './intro.js';
import './q2-demos.js';
import './image-viewer.js';

if(location.hash && ids.includes(location.hash.slice(1))) go(location.hash.slice(1));
else (document.fonts?document.fonts.ready:Promise.resolve()).then(startIntro);
import './ab-slides.js';

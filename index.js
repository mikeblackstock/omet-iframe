import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

import {
  h,
  app
} from 'hyperapp';

import {
  Box,
  Menubar,
  MenubarItem,
  Iframe
} from '@osjs/gui';


const view = (core, proc, win) =>
  (state, actions) => h(Box, {}, [
  
    h(Menubar, {}, [
      h(MenubarItem, {
        onclick: () => actions.update("Testing")
      }, 'Test'),
        
  
  	]),
  
  
    h(Iframe, {
      box: {grow: 1},
      src: state.src,
      id: state.id
    })
  ]);

const openFile = async (core, proc, win, a, file) => {
  const url = await core.make('osjs/vfs').url(file.path);
  const ref = Object.assign({}, file, {url});

  if (file.mime.match(/^text\/html?/)) {
    a.setSource(ref.url);
  }

  win.setTitle(`${proc.metadata.title.en_EN} - ${file.filename}`);
  proc.args.file = file;
};


osjs.register(applicationName, (core, args, options, metadata) => {
  const title = core.make('osjs/locale')
    .translatableFlat(metadata.title);

  const proc = core.make('osjs/application', {
    args,
    options,
    metadata
  });

  proc.createWindow({
    id: 'HTMLViewerWindow',
    title,
    icon: proc.resource(metadata.icon),
    dimension: {width: 400, height: 400}
  })
    .on('destroy', () => proc.destroy())
    .on('render', (win) => win.focus())
    .render(($content, win) => {
		const suffix = `?pid=${proc.pid}&wid=${win.wid}`;    	
      const a = app({
      	id: 'log',
        src: proc.resource('/data/index.html') +suffix
      }, {
        setSource: src => state => ({src}),
        update:  () => (state, actions) => {
        	document.getElementById(state.id).contentWindow.postMessage(Date.now(), window.location.href);
    	}	

      }, view(core, proc, win), $content);
      
      

      if (args.file) {
        openFile(core, proc, win, a, args.file);
      }

      win.on('drop', (ev, data) => {
        if (data.isFile && data.mime) {
          const found = metadata.mimes.find(m => (new RegExp(m)).test(data.mime));
          if (found) {
            openFile(core, proc, win, a, data);
          }
        }
      });
    });

  return proc;
});
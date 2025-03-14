import type { Plugin } from 'vite'
import { createFilePath, writeFile } from './file-utils'
import { getCalendar } from './getCalendar'
import { HtmlVisitor } from './HtmlVisitor'


let lock = false
const checkLock = () => lock
const setLock = (bool: boolean) => {
  lock = bool
}

function getConfig(init: {}, root: string): Config {
  return {
    tsFilename: "calendar.ts",
    jsonFilename: "calendar.json",
    rootdir: "src" 
  };
}

export interface Config {
  tsFilename: string;
  jsonFilename: string;
  rootdir: string;
}
export function erauVite(options: Partial<Config> = {}): Plugin {

  let ROOT: string = process.cwd()
  let userConfig = options as Config

  const generate = async () => {

    if (checkLock()) {
      return
    }
    setLock(true)
    try {
      const config = userConfig;
      const root = process.cwd();
      
      getCalendar()
      .then(calendar => new HtmlVisitor().visitHtml(calendar).close())
      .then(calendar => {
    
        const tsFile = createFilePath([root, config.rootdir], config.tsFilename);
        writeFile({ fullPath: tsFile.fullPath, content: calendar.ts });

        const jsonFile = createFilePath([root, config.rootdir], config.jsonFilename);
        writeFile({ fullPath: jsonFile.fullPath, content: calendar.json });
      })
      .then(data => {
        console.log('success');
      });
    
      console.log('\u{1F30D} generated new table');
    } catch (err) {
      console.error(err)
      console.info()
    } finally {
      setLock(false)
    }
  }

  const handleFile = async (
    file: string,
    event: 'create' | 'update' | 'delete',
  ) => {

    if (!(file.includes(userConfig.tsFilename) || file.includes(userConfig.jsonFilename))) {
      await generate()
    }
  }
  return {
    name: 'erau-vite',
    async watchChange(id, { event }) {
      await handleFile(id, event)
    },
    async configResolved(config) {
      userConfig = getConfig(options, ROOT)
      ROOT = config.root
      await generate()
    },
  }
}


import { getCalendar } from './getCalendar'
import { createFilePath, writeFile } from './file-utils'
import { HtmlVisitor } from './HtmlVisitor'

const FILE_NAME = 'calendar.ts';
const ROOT_DIR = 'src';

// run as node script 
// generates ts file from erau calendar url

getCalendar()
  .then(calendar => new HtmlVisitor().visitHtml(calendar).close())
  .then(calendar => {

    const path = createFilePath([ROOT_DIR], FILE_NAME);
    writeFile({ fullPath: path.fullPath, content: calendar.ts });
  })
  .then(data => {
    console.log('success');
  });

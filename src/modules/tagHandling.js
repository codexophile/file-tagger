const fs = require( 'fs' );
const ini = require( 'ini' );

const setupTagEditing = ( tagsIniPath ) => {
  const tagElements = document.querySelectorAll( '.tag-item' );

  tagElements.forEach( tag => {
    tag.addEventListener( 'dblclick', () => {
      const currentText = tag.textContent;
      const input = document.createElement( 'input' );
      input.value = currentText;

      input.addEventListener( 'blur', () => {
        updateTag( tag, input.value, tagsIniPath );
      } );

      input.addEventListener( 'keypress', ( e ) => {
        if ( e.key === 'Enter' ) {
          updateTag( tag, input.value, tagsIniPath );
        }
      } );

      tag.textContent = '';
      tag.appendChild( input );
      input.focus();
    } );
  } );
};

const updateTag = ( tagElement, newValue, tagsIniPath ) => {
  tagElement.textContent = newValue;
  saveTagsToIni( tagsIniPath );
};

const getNewTagsArray = ( tagsContainer ) => {
  return Array.from( tagsContainer.querySelectorAll( '.tag-item' ) )
    .map( tag => tag.textContent.trim() )
    .filter( tag => tag !== '' );
};

const sortObjectGroupsAlphabetically = ( config ) => {
  return Object.keys( config )
    .sort()
    .reduce( ( acc, key ) => {
      acc[ key ] = config[ key ];
      return acc;
    }, {} );
};

const populateTagsUI = ( mainEl, sortedData ) => {
  Object.entries( sortedData ).forEach( ( [ groupName, tags ] ) => {
    const groupDiv = document.createElement( 'div' );
    groupDiv.className = 'tag-group';

    const groupTitle = document.createElement( 'h3' );
    groupTitle.textContent = groupName;
    groupDiv.appendChild( groupTitle );

    const tagsList = document.createElement( 'div' );
    tagsList.className = 'tags-list';

    tags.forEach( tag => {
      const tagElement = document.createElement( 'span' );
      tagElement.className = 'tag-item';
      tagElement.textContent = tag;
      tagsList.appendChild( tagElement );
    } );

    groupDiv.appendChild( tagsList );
    mainEl.appendChild( groupDiv );
  } );
};

const saveTagsToIni = ( tagsIniPath ) => {
  const newConfig = {};
  const groups = document.querySelectorAll( '.tag-group' );

  groups.forEach( group => {
    const groupName = group.querySelector( 'h3' ).textContent;
    const tags = getNewTagsArray( group.querySelector( '.tags-list' ) );
    newConfig[ groupName ] = tags;
  } );

  fs.writeFileSync( tagsIniPath, ini.stringify( newConfig ) );
};

module.exports = {
  setupTagEditing,
  getNewTagsArray,
  sortObjectGroupsAlphabetically,
  populateTagsUI
};
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

    const $groupEl = $( `
      <div class="group">
        <span class="heading">${ groupName }</span>
      </div>
    ` ).appendTo( mainEl );

    Object.keys( tags ).forEach( key => {
      $( `<input type="checkbox" id="${ key }">` ).appendTo( $groupEl );
      $( `<label for="${ key }">${ key }</label>` ).appendTo( $groupEl )
        .on( 'contextmenu', ( event ) => {
          const esQuery = `[${ event.target.textContent }]`;
          const tempWindow = window.open( `es://"${ esQuery }"` );
          tempWindow.close();
        } );
    } );

  } );
};

const saveTagsToIni = ( tagsIniPath ) => {
  const newConfig = {};
  const groups = document.querySelectorAll( '.group' );

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
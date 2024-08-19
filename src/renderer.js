const fs = require( 'fs' )
const ini = require( 'ini' )
window.$ = window.jQuery = require( 'jquery' )
const path = require( 'path' )
const { ipcRenderer } = require( 'electron' )

ipcRenderer.on( 'command-line-args', ( event, args ) => {
    console.log( 'Received command line arguments:', args )
    // Use the arguments as needed
} )


// Read and parse the list of files
const inputFilesString = fs.readFileSync( './files_list.txt', 'utf-8' ).replace( /\r/g, '' )
const inputFiles = inputFilesString.split( '\n' )

const filesListEl = document.querySelector( '#filesList' )
// Populate the file list dropdown
inputFiles.forEach( file => {
    const $option = $( `<option>${ file }</option>` )
    filesListEl.add( $option[ 0 ] )
} )

// Handle file removal
document.querySelector( '#remove-btn' ).addEventListener( 'click', () => {
    filesListEl.remove( filesListEl.selectedIndex )
} )

// Handle the proceed button click
document.querySelector( '#proceed-btn' ).addEventListener( 'click', () => {
    const allTagsString = Array.from( document.querySelectorAll( 'input:checked' ) )
        .map( item => `[${ item.labels[ 0 ].textContent }]` )
        .join( '' )

    const filesArray = Array.from( filesListEl.options )

    filesArray.forEach( option => {
        const fullName = option.text
        const { name: fileName, ext: extension, dir: dirPath } = path.parse( fullName )
        const newFileName = `${ fileName } ${ allTagsString }${ extension }`
        const newPath = path.join( dirPath, newFileName )

        fs.rename( fullName, newPath, error => { if ( error ) { alert( error ) } } )
    } )
} )

// Read and parse the ini file
const iniContent = fs.readFileSync( './tags.ini', 'utf-8' )
const config = ini.parse( iniContent )
const mainEl = document.querySelector( '#main' )

// Populate the UI with tags from the ini file
Object.entries( config ).forEach( ( [ group, groupData ] ) => {
    const $groupEl = $( `<div class="group"><span class="heading">${ group }</span></div>` ).appendTo( mainEl )

    Object.keys( groupData ).forEach( key => {
        $( `<input type="checkbox" id="${ key }">` ).appendTo( $groupEl )
        $( `<label for="${ key }">${ key }</label>` ).appendTo( $groupEl )
    } )
} )

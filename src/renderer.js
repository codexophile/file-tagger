( async function () {
    'use strict'

    const fs = require( 'fs' )
    const ini = require( 'ini' )
    window.$ = window.jQuery = require( 'jquery' )
    const path = require( 'path' )
    const { ipcRenderer, clipboard } = require( 'electron' )

    const filesListEl = document.querySelector( '#filesList' )

    const args = await getArgs()
    if ( args[ 0 ] ) {
        const inputFilesString = args[ 0 ]
        const inputFilesArray = inputFilesString.trim().split( /\r?\n/ )
        // const inputFilesString = args.length > 0
        //     ? args[ 0 ]
        //     : fs.readFileSync( './files_list.txt', 'utf-8' )
        prepareInputFilesSection( inputFilesArray )
    }

    // Handle the proceed button click
    document.querySelector( '#proceed-btn' ).addEventListener( 'click', () => {

        const newTagsArray = getNewTagsArray()

        const filesArray = Array.from( filesListEl.options )

        filesArray.forEach( fileOption => {

            const fullName = fileOption.textContent

            const { name: fileName, ext: extension, dir: dirPath } = path.parse( fullName )

            const regexForTags = /\[\w+\]/g
            const currentTagsArray = fileName.match( regexForTags ) || []
            const fileNameWithoutTags = fileName.replaceAll( regexForTags, '' ).trim()

            const combinedUniqueTagsArray = [ ... new Set( [ ...currentTagsArray, ...newTagsArray ] ) ]
            const tagsString = combinedUniqueTagsArray.join( '' )

            const newFileName = `${ fileNameWithoutTags } ${ tagsString }${ extension }`
            const newPath = path.join( dirPath, newFileName )
            fs.rename( fullName, newPath, error => {
                if ( error ) { alert( error ) }
                else {
                    fileOption.remove()
                    $addFileOption( newPath )
                }
            } )

        } )
    } )
    document.querySelector( `#copy-tags-btn` ).addEventListener( 'click', () => {
        const newTagsArray = getNewTagsArray()
        const textToBeCopied = newTagsArray.join( '' )
        if ( textToBeCopied )
            clipboard.writeText( textToBeCopied )
    } )
    // Handle file removal
    document.querySelector( '#remove-btn' ).addEventListener( 'click', () => {
        filesListEl.remove( filesListEl.selectedIndex )
        filesListEl.selectedIndex = 0
    } )
    document.querySelector( '#clear-btn' ).addEventListener( 'click', () => {
        $( filesListEl ).find( 'option' ).remove()
    } )

    // Read and parse the ini file
    const iniContent = fs.readFileSync( './tags.ini', 'utf-8' )
    const config = ini.parse( iniContent )
    const sortedData = sortObjectGroupsAlphabetically( config )

    const mainEl = document.querySelector( '#main' )

    // Populate the UI with tags from the ini file
    Object.entries( sortedData ).forEach( ( [ group, groupData ] ) => {
        const $groupEl = $( `<div class="group"><span class="heading">${ group }</span></div>` ).appendTo( mainEl )

        Object.keys( groupData ).forEach( key => {
            $( `<input type="checkbox" id="${ key }">` ).appendTo( $groupEl )
            $( `<label for="${ key }">${ key }</label>` ).appendTo( $groupEl ).on( 'contextmenu', ( event ) => {
                const esQuery = `[${ event.target.textContent }]`
                const tempWindow = window.open( `es://"${ esQuery }"` )
                tempWindow.close()
            } )
        } )

    } )

    //* drag and drop

    // Prevent the default behavior when a file is dragged over the window
    window.addEventListener( 'dragover', ( event ) => {
        event.preventDefault()
    } )

    window.addEventListener( 'drop', ( event ) => {
        event.preventDefault()
        const files = Array.from( event.dataTransfer.files )
        const droppedFilesArray = files.map( file => file.path )
        prepareInputFilesSection( droppedFilesArray )

        // Send the file paths to the main process
        // ipcRenderer.send( 'files-dropped', files.map( file => file.path ) )
    } )

    //*__________________________________________________________________________________________________________________

    function getArgs () {
        return new Promise( resolve => {
            ipcRenderer.on( 'command-line-args', ( event, args ) => {
                resolve( args )
            } )
        } )
    }

    function prepareInputFilesSection ( inputFilesArray ) {
        // Populate the file list dropdown
        inputFilesArray.forEach( file => {

            $addFileOption( file )

        } )
    }

    function $addFileOption ( text ) {

        const $option = $( `<option>${ text }</option>` )
        filesListEl.add( $option[ 0 ] )

        fs.access( text, ( err ) => {
            if ( err ) {
                $option.addClass( 'error' )
            } else {
                $option.addClass( 'no-error' )
            }
        } )

        return $option
    }

    function getNewTagsArray () {
        return Array.from( document.querySelectorAll( 'input:checked' ) )
            .map( item => `[${ item.labels[ 0 ].textContent }]` )
    }

    function sortObjectGroupsAlphabetically ( obj ) {
        const sortedObj = {}

        Object.keys( obj ).forEach( group => {
            sortedObj[ group ] = {}

            // Sort keys alphabetically, ignoring case
            Object.keys( obj[ group ] )
                .sort( ( a, b ) => a.toLowerCase().localeCompare( b.toLowerCase() ) )
                .forEach( key => {
                    sortedObj[ group ][ key ] = obj[ group ][ key ]
                } )
        } )

        return sortedObj
    }

} )()
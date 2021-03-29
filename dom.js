// Start 
function startPage () {
    document.getElementsByClassName('courseName')[0].click()
    document.querySelector('.classind').style.opacity = '1'

    $(document).ready(function() {
        $('.js-example-basic-single').select2();
    });
    $('.js-example-basic-single').on('select2:select', function (e) {
        var data = e.params.data;
        console.log(data);

        var index = Array.from(data.element.parentElement.children).indexOf(data.element)

        document.getElementsByClassName('courseName')[index].click()
    });
    $('.js-example-basic-single').on('select2:open', function (e) {
        var div = document.querySelector("body > span > span > span.select2-search.select2-search--dropdown > input")
        div.focus();
    });
}


// Declare all helper functions here:
function helper_parseDate (date, format) {
    return moment(date, format).format('MMM D') 
}

function goToChildLink (el) {
    window.open(el.children[0].classList[0])
}

function helper_createAssignmentHTML (title, dueDate, pts, desc, att) {
    var HTML = `
    <div class="title">`+ title +`</div>
    <div class="points">`+ pts +`</div>
    <div class="dueDate">`+ dueDate +`</div>

    <div class="desc">`+ desc +`</div>
    <div class="attachments">`+ att +`</div>
   `

    var pushWrap = document.createElement('div'); 
    pushWrap.classList.add('assignment')
    pushWrap.innerHTML = HTML

    if (pushWrap.children[4].children[0]) {
        Array.prototype.forEach.call(pushWrap.children[4].children[0].children, function(el) {
            el.setAttribute("onclick", "goToChildLink(this)")
        })
    } 


    return pushWrap
} 

function helper_createTopicHeaderHTML (name) {
    var HTML = `
    <div class="topicName">`+ name +`</div>
   `

    var pushWrap = document.createElement('div'); 
    pushWrap.classList.add('topicHeader')
    pushWrap.innerHTML = HTML

    return pushWrap
}

function helper_createSideBarHTML (classTitle, id) {

    var pushWrap = document.createElement('span'); 
    pushWrap.classList.add('courseName')
    pushWrap.classList.add(id)
    pushWrap.innerHTML = classTitle

    pushWrap.onclick = function () {
        $('#mySelect2').val(this.innerHTML);

        var index = Array.from(this.parentElement.children).indexOf(this)
        animateCourseSwitch(index, false, this)

        Array.prototype.forEach.call(document.getElementsByClassName('courseName'), function(el) {
            el.classList.remove('active')
        })
        this.classList.add('active')
    }

    var optEl = document.createElement('option')
    optEl.value = classTitle
    optEl.innerHTML = classTitle

    document.querySelector('.classind').appendChild(optEl)

    getCourseWork(id, true);
    return pushWrap
} 

function helper_createAttachmentHTML (att) {
    var pushWrap = document.createElement('button');
    pushWrap.classList.add('attachmentItem');
    pushWrap.classList.add('attachmentItem');
    
    var url;
    var title;
    var name = Object.keys(att)[0]

    if (name == 'link') {
        url = att.link.url
        title = att.link.title
    } else if (name == 'driveFile') {
        url = att.driveFile.driveFile.alternateLink
        title = att.driveFile.driveFile.title
    } else if (name == 'form') {
        url = att.form.formUrl
        title = att.form.title
    } else if (name == 'youtubeVideo') {
        url = att.youtubeVideo.alternateLink
        title = att.youtubeVideo.title
    } 

    var HTML = `
    <div class="`+ url +`" href="`+ url +`">`+ title +`</div>
    `
    pushWrap.innerHTML = HTML;

    return pushWrap
}


//////////////////////
//////////////////////
//////////////////////
// Google Classroom //
//////////////////////
//////////////////////
//////////////////////


var currentCourseId
var queryCourseId


// Display a course topic
function displayCourseTopic (t, passive) {
    var name = t.name

    const wrap = document.querySelector('.assignmentList');
    const dummyWrap = document.querySelector('.DUMMYassignmentList');

    if (passive == true) {
        dummyWrap.appendChild(helper_createTopicHeaderHTML(name))
        saveCourseWork(t.courseId, dummyWrap.innerHTML)
        return;
    }

    wrap.appendChild(helper_createTopicHeaderHTML(name))
    saveCourseWork(t.courseId, wrap.innerHTML)
}

// Display a coursework/material
function displayCourseWork (work, passive, isTopicHeader, topic, hasTopic) {
    const wrap = document.querySelector('.assignmentList');
    const dummyWrap = document.querySelector('.DUMMYassignmentList');

    if (work) {
        queryCourseId = work.courseId
    } else {
        queryCourseId = topic.courseId
    }


    if (currentCourseId && currentCourseId != queryCourseId && passive == true) {
        dummyWrap.innerHTML = null;
    }

    if (isTopicHeader == true) {
        currentCourseId = topic.courseId;
        displayCourseTopic(topic, passive)
        return;
    }

    var title = work.title

    var desc; desc = ''
    if(work.description) desc = work.description

    var pts = work.maxPoints

    var workAtts;
    workAtts = ''

    if (work.materials) {
        var tmpWrap = document.createElement('div')
        Array.prototype.forEach.call(work.materials, function(mat) {
            tmpWrap.appendChild(helper_createAttachmentHTML(mat))
            workAtts = tmpWrap.outerHTML;
        })
    }

    var dueDate;
    dueDate = ''

    if (work.dueDate) {
        dueDate = 'Due ' + helper_parseDate(work.dueDate.year + ' ' + work.dueDate.month + ' ' + work.dueDate.day, 'YYYY M D') 
    } 
    if (work.dueTime) {
        if (work.dueTime.minutes && work.dueTime.hours) {
            
        } else {
            dueDate = dueDate + ', ' 
            if (work.dueTime.minutes) {
                dueDate = dueDate + ' ' + work.dueTime.hours + ':' + work.dueTime.minutes
            }
            if (work.dueTime.hours) {
                dueDate = dueDate + ' ' + moment(work.dueTime.hours, 'H').format('h:mm A') 
            }
        }
    }  

    currentCourseId = work.courseId;

    if (pts === undefined) {
        pts = '' 
    } else if (parseInt(pts) > 1) {
        pts = pts + 'pts'
    } else {
        pts = pts + 'pt'
    }

    if (hasTopic == false) {
        if (passive == true) {
            dummyWrap.insertBefore(helper_createAssignmentHTML(title, dueDate, pts, desc, workAtts), dummyWrap.firstChild)
            saveCourseWork(work.courseId, dummyWrap.innerHTML)
            return;
        }
    
        wrap.insertBefore(helper_createAssignmentHTML(title, dueDate, pts, desc, workAtts), wrap.firstChild)
        saveCourseWork(work.courseId, wrap.innerHTML)
        return;
    }

    if (passive == true) {
        dummyWrap.appendChild(helper_createAssignmentHTML(title, dueDate, pts, desc, workAtts))
        saveCourseWork(work.courseId, dummyWrap.innerHTML)
        return;
    }

    wrap.appendChild(helper_createAssignmentHTML(title, dueDate, pts, desc, workAtts))
    saveCourseWork(work.courseId, wrap.innerHTML)
}


// Display a locally saved course
function displaySavedCourseWork (id) {
    document.querySelector('.assignmentList').innerHTML = localStorage.getItem(id)
}

// Clear the locally saved courses
function clearSessionCourseWork () {
    if (document.getElementsByClassName('courseName')) {
        Array.prototype.forEach.call(document.getElementsByClassName('courseName'), function(el) {
            var idToRemove = el.classList[1]
            localStorage.removeItem(idToRemove)
        })
    }
}

// Save a course
function saveCourseWork (id, HTML) {
    localStorage.setItem(id, HTML)
}


// ALL ANIMATIONS / UI 

var button = document.querySelector('.classind');

button.onclick = switchClass

function switchClass () {

}

var wrapStatus;


function animateCourseSwitch (indexOfElToSwitchTo, wantClick, elRef) {

    var siblings = document.querySelector('.sidebar').children 
    var indexOfCurrentEl;

    if (document.querySelector('.courseName.active')) {
        indexOfCurrentEl = Array.from(siblings).indexOf(document.querySelector('.courseName.active'))
    } else {
        indexOfCurrentEl = -1;
    }

    var wrap = document.querySelector('.assignmentList');

    var x = indexOfCurrentEl
    var y = indexOfElToSwitchTo

    var whooshOutLeft = '0.2s cubic-bezier(.61,.61,.8,.86) 0s 1 normal forwards running whooshOutLeft'
    var whooshOutRight = '0.2s cubic-bezier(.61,.61,.8,.86) 0s 1 normal forwards running whooshOutRight'

    var whooshInLeft = '0.3s cubic-bezier(.59,.94,.62,.96) 0s 1 normal forwards running whooshInLeft'
    var whooshInRight = '0.3s cubic-bezier(.59,.94,.62,.96) 0s 1 normal forwards running whooshInRight'

    if (x == y) return;

    if (y > x) {
        // If the course we are switching to is AFTER the current course
        wrap.style.animation = whooshOutLeft

        setTimeout(function() {
            var checkHTMLInterval = setInterval(function() {
                if (checkHTML() == true) {
                    console.log('wow')
                    wrap.style.animation = whooshInRight
                    clearInterval(checkHTMLInterval)
                } 
            }, 10);
        }, 200)
    }

    if (y < x) {
        // If the course we are switching to is BEFORE the current course
        wrap.style.animation = whooshOutRight

        setTimeout(function() {
            var checkHTMLInterval = setInterval(function() {
                if (checkHTML() == true) {
                    console.log('wow')
                    wrap.style.animation = whooshInLeft
                    clearInterval(checkHTMLInterval)
                } 
            }, 10);
        }, 200)
    }


    if (document.querySelector('.courseName.active')) {
        setTimeout(function() {
            getCourseWork(elRef.classList[1]);
        }, 150)
    } else {
        getCourseWork(elRef.classList[1]);
    }

}




function checkHTML () {

    var wrap = document.querySelector('.assignmentList');

    if (wrap && wrap.children.length > 0){
        wrapStatus = true
    } else {
        wrapStatus = false
    }

    return wrapStatus;
}
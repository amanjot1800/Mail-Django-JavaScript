window.onpopstate = function(event) {
    console.log(event.state.mailbox);
}

document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    let recipient = document.querySelector('#compose-recipients');
    let subject = document.querySelector('#compose-subject');
    let body = document.querySelector('#compose-body');

    recipient.value = '';
    subject.value = '';
    body.value = '';

    document.querySelector('#compose-form').onsubmit = () => {
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipient.value,
                subject: subject.value,
                body: body.value
            })
        })
            .then(response => response.json())
            .then(result => {
                if (result.error !== undefined) {
                    alert(result.error);
                }
            });
    }
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch_emails(mailbox)
}

function fetch_emails(mailbox) {

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach(email => {

                const inner_div = document.createElement('div');
                inner_div.setAttribute('class', 'inner-div')

                const sender_node = document.createElement('div');
                sender_node.innerHTML = email['sender'];
                sender_node.setAttribute('class', 'sender');

                const subject_node = document.createElement('div');
                subject_node.innerHTML = email['subject'];
                subject_node.setAttribute('class', 'subject');

                const time_node = document.createElement('div');
                time_node.innerHTML = email['timestamp'];
                time_node.setAttribute('class', 'timestamp');

                const email_container = document.createElement('div');
                email_container.setAttribute('class', 'email-container');

                const archive_button = document.createElement('div');
                archive_button.setAttribute('class', 'archive-button');
                archive_button.innerHTML = `<img src="../../static/mail/archive.png" alt="Archive" width="30" />`

                inner_div.append(sender_node, subject_node, time_node);

                inner_div.addEventListener('click', () => {
                    fetch_email_by_id(email['id'])
                });

                if (mailbox !== 'sent') {
                    email_container.append(inner_div, archive_button);
                } else email_container.append(inner_div);

                archive_button.addEventListener('click', () => {
                    fetch(`/emails/${email['id']}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            archived: mailbox !== 'archive',
                        })
                    }).then(() => archive_button.parentElement.remove())
                })

                if (email['read']) {
                    email_container.style.backgroundColor = '#e1e1e1';
                }

                document.getElementById('emails-view').appendChild(email_container);

            })
        });
}


function fetch_email_by_id(id) {

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';


    fetch(`emails/${id}`)
        .then(response => response.json())
        .then(email => {
            document.querySelector('#from').innerHTML = `<b>From:</b> ${email.sender}`;
            document.querySelector('#to').innerHTML = `<b>To:</b> ${email.recipients}`;
            document.querySelector('#subject').innerHTML = `<b>Subject:</b> ${email.subject}`;
            document.querySelector('#timestamp').innerHTML = `<b>Timestamp:</b> ${email.timestamp}`;
            document.querySelector('#body').innerHTML = `${email.body}`;


            document.querySelector('#reply').addEventListener('click', () => {
                document.querySelector('#email-view').style.display = 'none';
                compose_email();

                let recipient = document.querySelector('#compose-recipients');
                let subject = document.querySelector('#compose-subject');
                let body = document.querySelector('#compose-body');

                recipient.value = email.sender;
                subject.value = email.subject.includes("Re:") ? `${email.subject}`: `Re: ${email.subject}`;
                body.value = `On ${email.timestamp} ${email.sender} wrote: \n${email.body} \n\n`;
            })

        });

    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    }).then()

}
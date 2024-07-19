import EmailDisplay from "~/components/email/email-content-page"

interface EmailContentPageProps {
    params: {
        id: string
    }
}
const EmailContentPage = (props: EmailContentPageProps) => {
    return (
        <EmailDisplay id={props.params.id}/> 
    )
}

export default EmailContentPage; 
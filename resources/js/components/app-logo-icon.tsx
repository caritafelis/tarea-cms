
import type { ImgHTMLAttributes } from 'react';

type AppLogoIconProps = Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'alt'
>;

export default function AppLogoIcon({
    className,
    ...props
}: AppLogoIconProps) {
    return (
        <img
            src="/brand/stuvgraph-logo.svg"
            alt="stuvgraph by stuvvion"
            className={className}
            {...props}
        />
    );
}
